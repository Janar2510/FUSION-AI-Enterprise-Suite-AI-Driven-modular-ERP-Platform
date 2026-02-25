# Invoicing Module

## Overview
The Invoicing module is part of the FusionAI Enterprise Suite, providing comprehensive invoice management and billing capabilities. This module handles customer management, product catalog, invoice creation, payment tracking, credit notes, and recurring invoices.

## Features
- Customer management with billing and shipping information
- Product catalog with pricing and tax information
- Invoice creation with line items and tax calculation
- Payment tracking and reconciliation
- Credit note processing for refunds and adjustments
- Recurring invoice templates for automated billing
- Multi-currency support
- Comprehensive reporting and analytics

## API Endpoints

### Customers
- `POST /api/v1/invoicing/customers` - Create a new customer
- `GET /api/v1/invoicing/customers/{customer_id}` - Get a customer by ID
- `PUT /api/v1/invoicing/customers/{customer_id}` - Update a customer
- `DELETE /api/v1/invoicing/customers/{customer_id}` - Delete a customer
- `GET /api/v1/invoicing/customers` - List customers

### Products
- `POST /api/v1/invoicing/products` - Create a new product
- `GET /api/v1/invoicing/products/{product_id}` - Get a product by ID
- `PUT /api/v1/invoicing/products/{product_id}` - Update a product
- `DELETE /api/v1/invoicing/products/{product_id}` - Delete a product
- `GET /api/v1/invoicing/products` - List products

### Invoices
- `POST /api/v1/invoicing/invoices` - Create a new invoice
- `GET /api/v1/invoicing/invoices/{invoice_id}` - Get an invoice by ID
- `PUT /api/v1/invoicing/invoices/{invoice_id}` - Update an invoice
- `DELETE /api/v1/invoicing/invoices/{invoice_id}` - Delete an invoice
- `POST /api/v1/invoicing/invoices/{invoice_id}/send` - Send an invoice
- `POST /api/v1/invoicing/invoices/{invoice_id}/cancel` - Cancel an invoice
- `GET /api/v1/invoicing/invoices` - List invoices

### Payments
- `POST /api/v1/invoicing/payments` - Create a new payment
- `GET /api/v1/invoicing/payments/{payment_id}` - Get a payment by ID
- `PUT /api/v1/invoicing/payments/{payment_id}` - Update a payment
- `DELETE /api/v1/invoicing/payments/{payment_id}` - Delete a payment

### Credit Notes
- `POST /api/v1/invoicing/credit-notes` - Create a new credit note
- `GET /api/v1/invoicing/credit-notes/{credit_note_id}` - Get a credit note by ID
- `PUT /api/v1/invoicing/credit-notes/{credit_note_id}` - Update a credit note
- `DELETE /api/v1/invoicing/credit-notes/{credit_note_id}` - Delete a credit note
- `POST /api/v1/invoicing/credit-notes/{credit_note_id}/issue` - Issue a credit note

### Recurring Templates
- `POST /api/v1/invoicing/recurring-templates` - Create a new recurring template
- `GET /api/v1/invoicing/recurring-templates/{template_id}` - Get a recurring template by ID
- `PUT /api/v1/invoicing/recurring-templates/{template_id}` - Update a recurring template
- `DELETE /api/v1/invoicing/recurring-templates/{template_id}` - Delete a recurring template
- `GET /api/v1/invoicing/recurring-templates` - List recurring templates

### Analytics
- `GET /api/v1/invoicing/analytics/invoice` - Get invoice analytics
- `POST /api/v1/invoicing/customer-statement` - Get customer statement

## Database Schema
The module uses the following tables:
- `customers` - Customer information
- `products` - Product catalog
- `invoices` - Invoice headers
- `invoice_lines` - Invoice line items
- `payments` - Payment records
- `credit_notes` - Credit note headers
- `credit_note_lines` - Credit note line items
- `recurring_invoice_templates` - Recurring invoice templates
- `recurring_template_lines` - Recurring template line items

## Integration
The Invoicing module integrates with:
- Accounting module (Tax, PaymentTerm entities)
- Contact Hub for customer information
- Notification system for invoice sending

## Testing
The module includes:
- Unit tests for service layer business logic
- API endpoint tests
- Mock database session for testing

## Dependencies
- FastAPI for REST API
- SQLAlchemy for database ORM
- Pydantic for data validation
- Python 3.8+

## Installation
The module is part of the FusionAI Enterprise Suite and is automatically included when running the main application.

## Usage
To use the invoicing module, make HTTP requests to the API endpoints as documented above. All endpoints require proper authentication and authorization.