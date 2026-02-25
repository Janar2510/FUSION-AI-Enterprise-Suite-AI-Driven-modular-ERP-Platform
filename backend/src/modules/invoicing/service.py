"""
Invoicing Service for FusionAI Enterprise Suite
Business logic for invoice management and billing operations
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, text, case
from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta
from decimal import Decimal
import logging
import random
import string

from .models import (
    Customer, Product, Invoice, InvoiceLine, Payment, 
    CreditNote, CreditNoteLine, RecurringInvoiceTemplate, RecurringTemplateLine
)
from .schemas import (
    CustomerCreate, CustomerUpdate,
    ProductCreate, ProductUpdate,
    InvoiceCreate, InvoiceUpdate,
    PaymentCreate, PaymentUpdate,
    CreditNoteCreate, CreditNoteUpdate,
    RecurringInvoiceTemplateCreate, RecurringInvoiceTemplateUpdate
)
from ..accounting.models import Tax, PaymentTerm
from ...core.database import get_async_session

logger = logging.getLogger(__name__)

class InvoicingService:
    """Service layer for invoicing operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # Customer methods
    async def create_customer(self, customer_data: CustomerCreate) -> Customer:
        """Create a new customer"""
        try:
            customer = Customer(**customer_data.dict())
            self.db.add(customer)
            await self.db.commit()
            await self.db.refresh(customer)
            
            logger.info(f"Created new customer: {customer.id}")
            return customer
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating customer: {e}")
            raise
    
    async def get_customer(self, customer_id: int) -> Optional[Customer]:
        """Get a customer by ID"""
        try:
            stmt = select(Customer).where(Customer.id == customer_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting customer {customer_id}: {e}")
            raise
    
    async def update_customer(self, customer_id: int, customer_data: CustomerUpdate) -> Customer:
        """Update an existing customer"""
        try:
            customer = await self.get_customer(customer_id)
            if not customer:
                raise ValueError(f"Customer {customer_id} not found")
            
            # Update fields
            update_data = customer_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(customer, field, value)
            
            await self.db.commit()
            await self.db.refresh(customer)
            
            logger.info(f"Updated customer: {customer_id}")
            return customer
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating customer {customer_id}: {e}")
            raise
    
    async def delete_customer(self, customer_id: int) -> bool:
        """Delete a customer"""
        try:
            customer = await self.get_customer(customer_id)
            if not customer:
                return False
            
            await self.db.delete(customer)
            await self.db.commit()
            
            logger.info(f"Deleted customer: {customer_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting customer {customer_id}: {e}")
            raise
    
    async def list_customers(self, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[Customer]:
        """List customers with pagination and optional status filter"""
        try:
            stmt = select(Customer)
            if status:
                stmt = stmt.where(Customer.status == status)
            stmt = stmt.offset(skip).limit(limit).order_by(Customer.name)
            
            result = await self.db.execute(stmt)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error listing customers: {e}")
            raise
    
    # Product methods
    async def create_product(self, product_data: ProductCreate) -> Product:
        """Create a new product"""
        try:
            product = Product(**product_data.dict())
            self.db.add(product)
            await self.db.commit()
            await self.db.refresh(product)
            
            logger.info(f"Created new product: {product.id}")
            return product
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating product: {e}")
            raise
    
    async def get_product(self, product_id: int) -> Optional[Product]:
        """Get a product by ID"""
        try:
            stmt = select(Product).where(Product.id == product_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting product {product_id}: {e}")
            raise
    
    async def update_product(self, product_id: int, product_data: ProductUpdate) -> Product:
        """Update an existing product"""
        try:
            product = await self.get_product(product_id)
            if not product:
                raise ValueError(f"Product {product_id} not found")
            
            # Update fields
            update_data = product_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(product, field, value)
            
            await self.db.commit()
            await self.db.refresh(product)
            
            logger.info(f"Updated product: {product_id}")
            return product
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating product {product_id}: {e}")
            raise
    
    async def delete_product(self, product_id: int) -> bool:
        """Delete a product"""
        try:
            product = await self.get_product(product_id)
            if not product:
                return False
            
            await self.db.delete(product)
            await self.db.commit()
            
            logger.info(f"Deleted product: {product_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting product {product_id}: {e}")
            raise
    
    async def list_products(self, skip: int = 0, limit: int = 100, active: Optional[bool] = None) -> List[Product]:
        """List products with pagination and optional active filter"""
        try:
            stmt = select(Product)
            if active is not None:
                stmt = stmt.where(Product.active == active)
            stmt = stmt.offset(skip).limit(limit).order_by(Product.name)
            
            result = await self.db.execute(stmt)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error listing products: {e}")
            raise
    
    # Invoice methods
    async def create_invoice(self, invoice_data: InvoiceCreate) -> Invoice:
        """Create a new invoice with validation"""
        try:
            # Generate invoice number
            invoice_number = await self.generate_invoice_number()
            
            # Create invoice header
            invoice_dict = invoice_data.dict(exclude={'lines'})
            invoice_dict['invoice_number'] = invoice_number
            invoice = Invoice(**invoice_dict)
            self.db.add(invoice)
            await self.db.flush()
            
            # Create invoice lines and calculate totals
            subtotal = Decimal('0.00')
            tax_amount = Decimal('0.00')
            
            for line_data in invoice_data.lines:
                line_dict = line_data.dict()
                line_dict['invoice_id'] = invoice.id
                
                # Calculate line total
                line_total = line_data.quantity * line_data.unit_price
                line_dict['line_total'] = line_total
                subtotal += line_total
                
                # Calculate tax if applicable
                if line_data.tax_id:
                    tax = await self.get_tax(line_data.tax_id)
                    if tax and tax.amount:
                        line_tax = (line_total * tax.amount / 100).quantize(Decimal('0.01'))
                        line_dict['tax_amount'] = line_tax
                        tax_amount += line_tax
                
                line = InvoiceLine(**line_dict)
                self.db.add(line)
            
            # Update invoice totals
            invoice.subtotal = subtotal
            invoice.tax_amount = tax_amount
            invoice.total_amount = subtotal + tax_amount
            
            await self.db.commit()
            await self.db.refresh(invoice)
            
            # Load lines
            await self.db.refresh(invoice, ["lines"])
            
            logger.info(f"Created new invoice: {invoice.invoice_number}")
            return invoice
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating invoice: {e}")
            raise
    
    async def generate_invoice_number(self) -> str:
        """Generate unique invoice number"""
        try:
            # Simple implementation - in production this would be more sophisticated
            stmt = select(func.count(Invoice.id))
            result = await self.db.execute(stmt)
            count = result.scalar_one() + 1
            
            # Generate invoice number in format INV-YYYY-XXXXX
            year = datetime.now().year
            return f"INV-{year}-{count:05d}"
        except Exception as e:
            logger.error(f"Error generating invoice number: {e}")
            # Fallback
            return f"INV-{datetime.now().strftime('%Y%m%d')}-{''.join(random.choices(string.digits, k=5))}"
    
    async def get_invoice(self, invoice_id: int) -> Optional[Invoice]:
        """Get an invoice by ID with lines"""
        try:
            stmt = select(Invoice).where(Invoice.id == invoice_id)
            result = await self.db.execute(stmt)
            invoice = result.scalar_one_or_none()
            
            if invoice:
                # Load lines
                await self.db.refresh(invoice, ["lines"])
            
            return invoice
        except Exception as e:
            logger.error(f"Error getting invoice {invoice_id}: {e}")
            raise
    
    async def update_invoice(self, invoice_id: int, invoice_data: InvoiceUpdate) -> Invoice:
        """Update an existing invoice"""
        try:
            invoice = await self.get_invoice(invoice_id)
            if not invoice:
                raise ValueError(f"Invoice {invoice_id} not found")
            
            if invoice.status != 'draft':
                raise ValueError("Only draft invoices can be updated")
            
            # Update fields
            update_data = invoice_data.dict(exclude_unset=True, exclude={'lines'})
            for field, value in update_data.items():
                setattr(invoice, field, value)
            
            # Update lines if provided
            if invoice_data.lines is not None:
                # Delete existing lines
                for line in invoice.lines:
                    await self.db.delete(line)
                
                # Create new lines and recalculate totals
                subtotal = Decimal('0.00')
                tax_amount = Decimal('0.00')
                
                for line_data in invoice_data.lines:
                    line_dict = line_data.dict(exclude_unset=True)
                    line_dict['invoice_id'] = invoice.id
                    
                    # Calculate line total
                    line_total = line_data.quantity * line_data.unit_price
                    line_dict['line_total'] = line_total
                    subtotal += line_total
                    
                    # Calculate tax if applicable
                    if line_data.tax_id:
                        tax = await self.get_tax(line_data.tax_id)
                        if tax and tax.amount:
                            line_tax = (line_total * tax.amount / 100).quantize(Decimal('0.01'))
                            line_dict['tax_amount'] = line_tax
                            tax_amount += line_tax
                    
                    line = InvoiceLine(**line_dict)
                    self.db.add(line)
                
                # Update invoice totals
                invoice.subtotal = subtotal
                invoice.tax_amount = tax_amount
                invoice.total_amount = subtotal + tax_amount
                
                # Refresh lines
                await self.db.flush()
                await self.db.refresh(invoice, ["lines"])
            
            await self.db.commit()
            await self.db.refresh(invoice)
            
            logger.info(f"Updated invoice: {invoice_id}")
            return invoice
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating invoice {invoice_id}: {e}")
            raise
    
    async def delete_invoice(self, invoice_id: int) -> bool:
        """Delete an invoice"""
        try:
            invoice = await self.get_invoice(invoice_id)
            if not invoice:
                return False
            
            if invoice.status != 'draft':
                raise ValueError("Only draft invoices can be deleted")
            
            await self.db.delete(invoice)
            await self.db.commit()
            
            logger.info(f"Deleted invoice: {invoice_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting invoice {invoice_id}: {e}")
            raise
    
    async def send_invoice(self, invoice_id: int) -> Invoice:
        """Send an invoice to customer"""
        try:
            invoice = await self.get_invoice(invoice_id)
            if not invoice:
                raise ValueError(f"Invoice {invoice_id} not found")
            
            if invoice.status == 'draft':
                invoice.status = 'sent'
                invoice.sent_at = datetime.utcnow()
            
            await self.db.commit()
            await self.db.refresh(invoice)
            
            logger.info(f"Sent invoice: {invoice_id}")
            return invoice
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error sending invoice {invoice_id}: {e}")
            raise
    
    async def cancel_invoice(self, invoice_id: int) -> Invoice:
        """Cancel an invoice"""
        try:
            invoice = await self.get_invoice(invoice_id)
            if not invoice:
                raise ValueError(f"Invoice {invoice_id} not found")
            
            if invoice.status not in ['draft', 'sent']:
                raise ValueError("Only draft or sent invoices can be cancelled")
            
            invoice.status = 'cancelled'
            invoice.cancelled_at = datetime.utcnow()
            
            await self.db.commit()
            await self.db.refresh(invoice)
            
            logger.info(f"Cancelled invoice: {invoice_id}")
            return invoice
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error cancelling invoice {invoice_id}: {e}")
            raise
    
    async def list_invoices(self, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[Invoice]:
        """List invoices with pagination and optional status filter"""
        try:
            stmt = select(Invoice)
            if status:
                stmt = stmt.where(Invoice.status == status)
            stmt = stmt.offset(skip).limit(limit).order_by(Invoice.invoice_date.desc())
            
            result = await self.db.execute(stmt)
            invoices = result.scalars().all()
            
            # Load lines for each invoice
            for invoice in invoices:
                await self.db.refresh(invoice, ["lines"])
            
            return invoices
        except Exception as e:
            logger.error(f"Error listing invoices: {e}")
            raise
    
    # Payment methods
    async def create_payment(self, payment_data: PaymentCreate) -> Payment:
        """Create a new payment"""
        try:
            payment = Payment(**payment_data.dict())
            self.db.add(payment)
            
            # Update invoice status if fully paid
            invoice = await self.get_invoice(payment_data.invoice_id)
            if invoice:
                total_payments = await self.get_invoice_payments_total(payment_data.invoice_id)
                if total_payments >= invoice.total_amount:
                    invoice.status = 'paid'
                    invoice.paid_at = datetime.utcnow()
            
            await self.db.commit()
            await self.db.refresh(payment)
            
            logger.info(f"Created new payment: {payment.id}")
            return payment
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating payment: {e}")
            raise
    
    async def get_payment(self, payment_id: int) -> Optional[Payment]:
        """Get a payment by ID"""
        try:
            stmt = select(Payment).where(Payment.id == payment_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting payment {payment_id}: {e}")
            raise
    
    async def update_payment(self, payment_id: int, payment_data: PaymentUpdate) -> Payment:
        """Update an existing payment"""
        try:
            payment = await self.get_payment(payment_id)
            if not payment:
                raise ValueError(f"Payment {payment_id} not found")
            
            # Update fields
            update_data = payment_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(payment, field, value)
            
            await self.db.commit()
            await self.db.refresh(payment)
            
            logger.info(f"Updated payment: {payment_id}")
            return payment
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating payment {payment_id}: {e}")
            raise
    
    async def delete_payment(self, payment_id: int) -> bool:
        """Delete a payment"""
        try:
            payment = await self.get_payment(payment_id)
            if not payment:
                return False
            
            await self.db.delete(payment)
            await self.db.commit()
            
            logger.info(f"Deleted payment: {payment_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting payment {payment_id}: {e}")
            raise
    
    async def get_invoice_payments_total(self, invoice_id: int) -> Decimal:
        """Get total payments for an invoice"""
        try:
            stmt = select(func.sum(Payment.amount)).where(
                and_(
                    Payment.invoice_id == invoice_id,
                    Payment.status == 'completed'
                )
            )
            result = await self.db.execute(stmt)
            total = result.scalar_one()
            return total or Decimal('0.00')
        except Exception as e:
            logger.error(f"Error getting invoice payments total for {invoice_id}: {e}")
            return Decimal('0.00')
    
    # Credit Note methods
    async def create_credit_note(self, credit_note_data: CreditNoteCreate) -> CreditNote:
        """Create a new credit note"""
        try:
            # Generate credit note number
            credit_note_number = await self.generate_credit_note_number()
            
            # Create credit note header
            credit_note_dict = credit_note_data.dict(exclude={'lines'})
            credit_note_dict['credit_note_number'] = credit_note_number
            credit_note = CreditNote(**credit_note_dict)
            self.db.add(credit_note)
            await self.db.flush()
            
            # Create credit note lines and calculate totals
            subtotal = Decimal('0.00')
            tax_amount = Decimal('0.00')
            
            for line_data in credit_note_data.lines:
                line_dict = line_data.dict()
                line_dict['credit_note_id'] = credit_note.id
                
                # Calculate line total
                line_total = line_data.quantity * line_data.unit_price
                line_dict['line_total'] = line_total
                subtotal += line_total
                
                # Calculate tax if applicable
                if line_data.tax_id:
                    tax = await self.get_tax(line_data.tax_id)
                    if tax and tax.amount:
                        line_tax = (line_total * tax.amount / 100).quantize(Decimal('0.01'))
                        line_dict['tax_amount'] = line_tax
                        tax_amount += line_tax
                
                line = CreditNoteLine(**line_dict)
                self.db.add(line)
            
            # Update credit note totals
            credit_note.subtotal = subtotal
            credit_note.tax_amount = tax_amount
            credit_note.total_amount = subtotal + tax_amount
            
            await self.db.commit()
            await self.db.refresh(credit_note)
            
            # Load lines
            await self.db.refresh(credit_note, ["lines"])
            
            logger.info(f"Created new credit note: {credit_note.credit_note_number}")
            return credit_note
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating credit note: {e}")
            raise
    
    async def generate_credit_note_number(self) -> str:
        """Generate unique credit note number"""
        try:
            # Simple implementation - in production this would be more sophisticated
            stmt = select(func.count(CreditNote.id))
            result = await self.db.execute(stmt)
            count = result.scalar_one() + 1
            
            # Generate credit note number in format CN-YYYY-XXXXX
            year = datetime.now().year
            return f"CN-{year}-{count:05d}"
        except Exception as e:
            logger.error(f"Error generating credit note number: {e}")
            # Fallback
            return f"CN-{datetime.now().strftime('%Y%m%d')}-{''.join(random.choices(string.digits, k=5))}"
    
    async def get_credit_note(self, credit_note_id: int) -> Optional[CreditNote]:
        """Get a credit note by ID with lines"""
        try:
            stmt = select(CreditNote).where(CreditNote.id == credit_note_id)
            result = await self.db.execute(stmt)
            credit_note = result.scalar_one_or_none()
            
            if credit_note:
                # Load lines
                await self.db.refresh(credit_note, ["lines"])
            
            return credit_note
        except Exception as e:
            logger.error(f"Error getting credit note {credit_note_id}: {e}")
            raise
    
    async def update_credit_note(self, credit_note_id: int, credit_note_data: CreditNoteUpdate) -> CreditNote:
        """Update an existing credit note"""
        try:
            credit_note = await self.get_credit_note(credit_note_id)
            if not credit_note:
                raise ValueError(f"Credit note {credit_note_id} not found")
            
            if credit_note.status != 'draft':
                raise ValueError("Only draft credit notes can be updated")
            
            # Update fields
            update_data = credit_note_data.dict(exclude_unset=True, exclude={'lines'})
            for field, value in update_data.items():
                setattr(credit_note, field, value)
            
            # Update lines if provided
            if credit_note_data.lines is not None:
                # Delete existing lines
                for line in credit_note.lines:
                    await self.db.delete(line)
                
                # Create new lines and recalculate totals
                subtotal = Decimal('0.00')
                tax_amount = Decimal('0.00')
                
                for line_data in credit_note_data.lines:
                    line_dict = line_data.dict(exclude_unset=True)
                    line_dict['credit_note_id'] = credit_note.id
                    
                    # Calculate line total
                    line_total = line_data.quantity * line_data.unit_price
                    line_dict['line_total'] = line_total
                    subtotal += line_total
                    
                    # Calculate tax if applicable
                    if line_data.tax_id:
                        tax = await self.get_tax(line_data.tax_id)
                        if tax and tax.amount:
                            line_tax = (line_total * tax.amount / 100).quantize(Decimal('0.01'))
                            line_dict['tax_amount'] = line_tax
                            tax_amount += line_tax
                    
                    line = CreditNoteLine(**line_dict)
                    self.db.add(line)
                
                # Update credit note totals
                credit_note.subtotal = subtotal
                credit_note.tax_amount = tax_amount
                credit_note.total_amount = subtotal + tax_amount
                
                # Refresh lines
                await self.db.flush()
                await self.db.refresh(credit_note, ["lines"])
            
            await self.db.commit()
            await self.db.refresh(credit_note)
            
            logger.info(f"Updated credit note: {credit_note_id}")
            return credit_note
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating credit note {credit_note_id}: {e}")
            raise
    
    async def delete_credit_note(self, credit_note_id: int) -> bool:
        """Delete a credit note"""
        try:
            credit_note = await self.get_credit_note(credit_note_id)
            if not credit_note:
                return False
            
            if credit_note.status != 'draft':
                raise ValueError("Only draft credit notes can be deleted")
            
            await self.db.delete(credit_note)
            await self.db.commit()
            
            logger.info(f"Deleted credit note: {credit_note_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting credit note {credit_note_id}: {e}")
            raise
    
    async def issue_credit_note(self, credit_note_id: int) -> CreditNote:
        """Issue a credit note"""
        try:
            credit_note = await self.get_credit_note(credit_note_id)
            if not credit_note:
                raise ValueError(f"Credit note {credit_note_id} not found")
            
            if credit_note.status == 'draft':
                credit_note.status = 'issued'
                credit_note.issued_at = datetime.utcnow()
            
            await self.db.commit()
            await self.db.refresh(credit_note)
            
            logger.info(f"Issued credit note: {credit_note_id}")
            return credit_note
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error issuing credit note {credit_note_id}: {e}")
            raise
    
    # Recurring Invoice methods
    async def create_recurring_template(self, template_data: RecurringInvoiceTemplateCreate) -> RecurringInvoiceTemplate:
        """Create a new recurring invoice template"""
        try:
            template = RecurringInvoiceTemplate(**template_data.dict(exclude={'lines'}))
            self.db.add(template)
            await self.db.flush()
            
            # Create template lines and calculate totals
            subtotal = Decimal('0.00')
            tax_amount = Decimal('0.00')
            
            for line_data in template_data.lines:
                line_dict = line_data.dict()
                line_dict['template_id'] = template.id
                
                # Calculate line total
                line_total = line_data.quantity * line_data.unit_price
                line_dict['line_total'] = line_total
                subtotal += line_total
                
                # Calculate tax if applicable
                if line_data.tax_id:
                    tax = await self.get_tax(line_data.tax_id)
                    if tax and tax.amount:
                        line_tax = (line_total * tax.amount / 100).quantize(Decimal('0.01'))
                        line_dict['tax_amount'] = line_tax
                        tax_amount += line_tax
                
                line = RecurringTemplateLine(**line_dict)
                self.db.add(line)
            
            # Update template totals
            template.subtotal = subtotal
            template.tax_amount = tax_amount
            template.total_amount = subtotal + tax_amount
            
            await self.db.commit()
            await self.db.refresh(template)
            
            # Load lines
            await self.db.refresh(template, ["lines"])
            
            logger.info(f"Created new recurring template: {template.id}")
            return template
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating recurring template: {e}")
            raise
    
    async def get_recurring_template(self, template_id: int) -> Optional[RecurringInvoiceTemplate]:
        """Get a recurring template by ID with lines"""
        try:
            stmt = select(RecurringInvoiceTemplate).where(RecurringInvoiceTemplate.id == template_id)
            result = await self.db.execute(stmt)
            template = result.scalar_one_or_none()
            
            if template:
                # Load lines
                await self.db.refresh(template, ["lines"])
            
            return template
        except Exception as e:
            logger.error(f"Error getting recurring template {template_id}: {e}")
            raise
    
    async def update_recurring_template(self, template_id: int, template_data: RecurringInvoiceTemplateUpdate) -> RecurringInvoiceTemplate:
        """Update an existing recurring template"""
        try:
            template = await self.get_recurring_template(template_id)
            if not template:
                raise ValueError(f"Recurring template {template_id} not found")
            
            # Update fields
            update_data = template_data.dict(exclude_unset=True, exclude={'lines'})
            for field, value in update_data.items():
                setattr(template, field, value)
            
            # Update lines if provided
            if template_data.lines is not None:
                # Delete existing lines
                for line in template.lines:
                    await self.db.delete(line)
                
                # Create new lines and recalculate totals
                subtotal = Decimal('0.00')
                tax_amount = Decimal('0.00')
                
                for line_data in template_data.lines:
                    line_dict = line_data.dict(exclude_unset=True)
                    line_dict['template_id'] = template.id
                    
                    # Calculate line total
                    line_total = line_data.quantity * line_data.unit_price
                    line_dict['line_total'] = line_total
                    subtotal += line_total
                    
                    # Calculate tax if applicable
                    if line_data.tax_id:
                        tax = await self.get_tax(line_data.tax_id)
                        if tax and tax.amount:
                            line_tax = (line_total * tax.amount / 100).quantize(Decimal('0.01'))
                            line_dict['tax_amount'] = line_tax
                            tax_amount += line_tax
                    
                    line = RecurringTemplateLine(**line_dict)
                    self.db.add(line)
                
                # Update template totals
                template.subtotal = subtotal
                template.tax_amount = tax_amount
                template.total_amount = subtotal + tax_amount
                
                # Refresh lines
                await self.db.flush()
                await self.db.refresh(template, ["lines"])
            
            await self.db.commit()
            await self.db.refresh(template)
            
            logger.info(f"Updated recurring template: {template_id}")
            return template
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating recurring template {template_id}: {e}")
            raise
    
    async def delete_recurring_template(self, template_id: int) -> bool:
        """Delete a recurring template"""
        try:
            template = await self.get_recurring_template(template_id)
            if not template:
                return False
            
            await self.db.delete(template)
            await self.db.commit()
            
            logger.info(f"Deleted recurring template: {template_id}")
            return True
            
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting recurring template {template_id}: {e}")
            raise
    
    async def list_recurring_templates(self, skip: int = 0, limit: int = 100, status: Optional[str] = None) -> List[RecurringInvoiceTemplate]:
        """List recurring templates with pagination and optional status filter"""
        try:
            stmt = select(RecurringInvoiceTemplate)
            if status:
                stmt = stmt.where(RecurringInvoiceTemplate.status == status)
            stmt = stmt.offset(skip).limit(limit).order_by(RecurringInvoiceTemplate.name)
            
            result = await self.db.execute(stmt)
            templates = result.scalars().all()
            
            # Load lines for each template
            for template in templates:
                await self.db.refresh(template, ["lines"])
            
            return templates
        except Exception as e:
            logger.error(f"Error listing recurring templates: {e}")
            raise
    
    # Helper methods
    async def get_tax(self, tax_id: int) -> Optional[Tax]:
        """Get a tax by ID"""
        try:
            stmt = select(Tax).where(Tax.id == tax_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting tax {tax_id}: {e}")
            return None
    
    async def get_payment_term(self, payment_term_id: int) -> Optional[PaymentTerm]:
        """Get a payment term by ID"""
        try:
            stmt = select(PaymentTerm).where(PaymentTerm.id == payment_term_id)
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error getting payment term {payment_term_id}: {e}")
            return None
    
    # Analytics methods
    async def get_invoice_analytics(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """Get invoice analytics for a date range"""
        try:
            # Get invoice counts and amounts
            stmt = select(
                func.count(Invoice.id),
                func.sum(Invoice.total_amount),
                func.sum(case((Invoice.status == 'paid', Invoice.total_amount), else_=0)),
                func.sum(case((Invoice.status == 'overdue', Invoice.total_amount), else_=0))
            ).where(
                and_(
                    Invoice.invoice_date >= start_date,
                    Invoice.invoice_date <= end_date
                )
            )
            
            result = await self.db.execute(stmt)
            count, total, paid, overdue = result.fetchone() or (0, 0, 0, 0)
            
            # Get paid invoice count
            stmt = select(func.count(Invoice.id)).where(
                and_(
                    Invoice.status == 'paid',
                    Invoice.invoice_date >= start_date,
                    Invoice.invoice_date <= end_date
                )
            )
            result = await self.db.execute(stmt)
            paid_count = result.scalar_one() or 0
            
            # Get overdue invoice count
            stmt = select(func.count(Invoice.id)).where(
                and_(
                    Invoice.status == 'overdue',
                    Invoice.invoice_date >= start_date,
                    Invoice.invoice_date <= end_date
                )
            )
            result = await self.db.execute(stmt)
            overdue_count = result.scalar_one() or 0
            
            # Calculate average payment time
            stmt = select(
                func.avg(func.extract('day', Invoice.paid_at - Invoice.invoice_date))
            ).where(
                and_(
                    Invoice.status == 'paid',
                    Invoice.paid_at.isnot(None),
                    Invoice.invoice_date >= start_date,
                    Invoice.invoice_date <= end_date
                )
            )
            result = await self.db.execute(stmt)
            avg_payment_time = result.scalar_one() or 0
            
            analytics = {
                "total_invoices": count or 0,
                "total_amount": total or Decimal('0.00'),
                "paid_amount": paid or Decimal('0.00'),
                "outstanding_amount": (total or Decimal('0.00')) - (paid or Decimal('0.00')),
                "overdue_amount": overdue or Decimal('0.00'),
                "paid_invoices": paid_count,
                "overdue_invoices": overdue_count,
                "average_payment_time": int(avg_payment_time)
            }
            
            return analytics
            
        except Exception as e:
            logger.error(f"Error getting invoice analytics: {e}")
            raise
    
    async def get_customer_statement(self, customer_id: int, start_date: date, end_date: date) -> Dict[str, Any]:
        """Get customer statement for a date range"""
        try:
            customer = await self.get_customer(customer_id)
            if not customer:
                raise ValueError(f"Customer {customer_id} not found")
            
            # Get opening balance (invoices before start date)
            stmt = select(func.sum(Invoice.total_amount)).where(
                and_(
                    Invoice.customer_id == customer_id,
                    Invoice.invoice_date < start_date
                )
            )
            result = await self.db.execute(stmt)
            opening_balance = result.scalar_one() or Decimal('0.00')
            
            # Get closing balance (invoices up to end date)
            stmt = select(func.sum(Invoice.total_amount)).where(
                and_(
                    Invoice.customer_id == customer_id,
                    Invoice.invoice_date <= end_date
                )
            )
            result = await self.db.execute(stmt)
            closing_balance = result.scalar_one() or Decimal('0.00')
            
            # Get transactions (invoices in date range)
            stmt = select(Invoice).where(
                and_(
                    Invoice.customer_id == customer_id,
                    Invoice.invoice_date >= start_date,
                    Invoice.invoice_date <= end_date
                )
            ).order_by(Invoice.invoice_date)
            
            result = await self.db.execute(stmt)
            invoices = result.scalars().all()
            
            transactions = []
            for invoice in invoices:
                transactions.append({
                    "date": invoice.invoice_date,
                    "type": "invoice",
                    "reference": invoice.invoice_number,
                    "amount": invoice.total_amount,
                    "balance": opening_balance + sum(inv.total_amount for inv in invoices if inv.invoice_date <= invoice.invoice_date)
                })
            
            statement = {
                "customer": customer,
                "opening_balance": opening_balance,
                "closing_balance": closing_balance,
                "transactions": transactions,
                "period": {
                    "start_date": start_date,
                    "end_date": end_date
                }
            }
            
            return statement
            
        except Exception as e:
            logger.error(f"Error getting customer statement: {e}")
            raise