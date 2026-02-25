from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from .models import WebCart, WebCartItem, WebOrder, CustomerReview, WebCartStatus
from ..sales.models import SalesOrder, SalesOrderItem, OrderStatus
from ..inventory.models import InventoryProduct

class EcommerceService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_cart(self, session_id: str = None, customer_id: int = None):
        """Gets active cart or creates a new one"""
        if session_id:
            cart = self.db.query(WebCart).filter(
                WebCart.session_id == session_id,
                WebCart.status == WebCartStatus.ACTIVE
            ).first()
            if cart:
                return cart

        # Create new cart
        new_session_id = session_id or str(uuid.uuid4())
        cart = WebCart(session_id=new_session_id, customer_id=customer_id)
        self.db.add(cart)
        self.db.commit()
        self.db.refresh(cart)
        return cart

    def get_products(self, category_id: int = None, limit: int = 20):
        query = self.db.query(InventoryProduct).filter(InventoryProduct.is_active == True)
        if category_id:
            query = query.filter(InventoryProduct.category_id == category_id)
        return query.limit(limit).all()

    def get_product(self, product_id: int):
        return self.db.query(InventoryProduct).filter(InventoryProduct.id == product_id).first()

    def add_to_cart(self, session_id: str, product_id: int, quantity: float = 1.0):
        cart = self.get_or_create_cart(session_id)
        product = self.get_product(product_id)
        
        if not product:
            raise ValueError("Product not found")

        # Check if item already exists in cart
        existing_item = self.db.query(WebCartItem).filter(
            WebCartItem.cart_id == cart.id,
            WebCartItem.product_id == product_id
        ).first()

        if existing_item:
            existing_item.quantity += quantity
            existing_item.line_total = existing_item.quantity * existing_item.unit_price
        else:
            item = WebCartItem(
                cart_id=cart.id,
                product_id=product.id,
                product_name=product.name,
                product_sku=product.sku,
                quantity=quantity,
                unit_price=product.cost_price or 10.0, # fallback price if not set
                line_total=(product.cost_price or 10.0) * quantity
            )
            self.db.add(item)
            
        self.db.commit()
        self._recalculate_cart(cart)
        return cart
        
    def _recalculate_cart(self, cart: WebCart):
        subtotal = sum(item.line_total for item in cart.items)
        cart.subtotal = subtotal
        cart.tax_amount = subtotal * 0.1 # 10% mock tax
        cart.total_amount = cart.subtotal + cart.tax_amount - cart.discount_amount
        self.db.commit()
        self.db.refresh(cart)

    def checkout_cart(self, session_id: str, email: str, name: str):
        cart = self.get_or_create_cart(session_id)
        
        if not cart.items:
            raise ValueError("Cart is empty")

        # 1. Create native SaleOrder
        order_number = f"WEB-{int(datetime.now().timestamp())}"
        sale_order = SalesOrder(
            order_number=order_number,
            customer_name=name,
            customer_email=email,
            title=f"Web Order for {name}",
            status=OrderStatus.PENDING,
            subtotal=cart.subtotal,
            tax_amount=cart.tax_amount,
            total_amount=cart.total_amount
        )
        self.db.add(sale_order)
        self.db.flush()

        # 2. Add items to SaleOrder
        for item in cart.items:
            so_item = SalesOrderItem(
                order_id=sale_order.id,
                product_name=item.product_name,
                product_sku=item.product_sku,
                quantity=item.quantity,
                unit_price=item.unit_price,
                line_total=item.line_total
            )
            self.db.add(so_item)

        # 3. Create WebOrder linking object
        web_order = WebOrder(
            order_number=order_number,
            sale_order_id=sale_order.id,
            cart_id=cart.id,
            gateway_status="pending_payment"
        )
        self.db.add(web_order)
        
        # 4. Mark cart as completed
        cart.status = WebCartStatus.COMPLETED
        
        self.db.commit()
        self.db.refresh(web_order)
        return web_order
