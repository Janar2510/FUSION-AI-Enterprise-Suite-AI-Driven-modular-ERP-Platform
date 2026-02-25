from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, case
from sqlalchemy.orm import selectinload
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from decimal import Decimal

from .models import (
    Product, ProductCategory, WarehouseLocation, StockMovement, 
    DemandForecast, InventoryAlert, InventoryTransaction,
    ProductStatus, StockMovementType
)
from .schemas import (
    ProductCreate, ProductUpdate, StockMovementCreate,
    DemandForecastCreate, InventoryAlertCreate, InventoryTransactionCreate
)

class InventoryService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # Product Management
    async def create_product(self, product_data: ProductCreate, user_id: int) -> Dict:
        """Create a new product"""
        try:
            product = Product(
                sku=product_data.sku,
                name=product_data.name,
                description=product_data.description,
                category_id=product_data.category_id,
                warehouse_id=product_data.warehouse_id,
                brand=product_data.brand,
                model=product_data.model,
                color=product_data.color,
                size=product_data.size,
                weight=product_data.weight,
                dimensions=product_data.dimensions,
                cost_price=product_data.cost_price,
                selling_price=product_data.selling_price,
                msrp=product_data.msrp,
                min_stock_level=product_data.min_stock_level,
                max_stock_level=product_data.max_stock_level,
                reorder_point=product_data.reorder_point,
                reorder_quantity=product_data.reorder_quantity,
                status=product_data.status,
                is_trackable=product_data.is_trackable,
                is_serialized=product_data.is_serialized,
                barcode=product_data.barcode,
                tags=product_data.tags
            )
            
            self.db.add(product)
            await self.db.commit()
            await self.db.refresh(product)
            
            return self._serialize_product(product)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating product: {e}")
            raise
    
    async def get_products(
        self, 
        page: int = 1, 
        limit: int = 50,
        category_id: Optional[int] = None,
        warehouse_id: Optional[int] = None,
        status: Optional[ProductStatus] = None,
        search: Optional[str] = None,
        low_stock_only: Optional[bool] = None,
        out_of_stock_only: Optional[bool] = None
    ) -> List[Dict]:
        """Get paginated products with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(Product)
            
            # Apply filters
            filters = []
            if category_id:
                filters.append(Product.category_id == category_id)
            if warehouse_id:
                filters.append(Product.warehouse_id == warehouse_id)
            if status:
                filters.append(Product.status == status)
            if search:
                filters.append(
                    or_(
                        Product.name.ilike(f"%{search}%"),
                        Product.sku.ilike(f"%{search}%"),
                        Product.description.ilike(f"%{search}%")
                    )
                )
            if low_stock_only:
                filters.append(Product.current_stock <= Product.reorder_point)
            if out_of_stock_only:
                filters.append(Product.current_stock == 0)
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(Product.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            products = result.scalars().all()
            
            return [self._serialize_product(product) for product in products]
        except Exception as e:
            print(f"Error getting products: {e}")
            return []
    
    async def get_product(self, product_id: int) -> Optional[Dict]:
        """Get a specific product by ID"""
        try:
            product = await self.db.get(Product, product_id)
            if product:
                return self._serialize_product(product)
            return None
        except Exception as e:
            print(f"Error getting product: {e}")
            return None
    
    async def update_product(self, product_id: int, product_data: ProductUpdate) -> Optional[Dict]:
        """Update a product"""
        try:
            product = await self.db.get(Product, product_id)
            if not product:
                return None
            
            # Update fields
            for field, value in product_data.dict(exclude_unset=True).items():
                setattr(product, field, value)
            
            await self.db.commit()
            await self.db.refresh(product)
            
            return self._serialize_product(product)
        except Exception as e:
            await self.db.rollback()
            print(f"Error updating product: {e}")
            return None
    
    # Stock Movement Management
    async def create_stock_movement(self, movement_data: StockMovementCreate, user_id: int) -> Dict:
        """Create a stock movement and update product stock"""
        try:
            # Calculate total cost
            total_cost = None
            if movement_data.unit_cost and movement_data.quantity:
                total_cost = movement_data.unit_cost * movement_data.quantity
            
            # Create stock movement
            movement = StockMovement(
                product_id=movement_data.product_id,
                warehouse_id=movement_data.warehouse_id,
                movement_type=movement_data.movement_type,
                quantity=movement_data.quantity,
                unit_cost=movement_data.unit_cost,
                total_cost=total_cost,
                reference_number=movement_data.reference_number,
                reference_type=movement_data.reference_type,
                reference_id=movement_data.reference_id,
                reason=movement_data.reason,
                notes=movement_data.notes,
                serial_numbers=movement_data.serial_numbers,
                created_by=user_id
            )
            
            self.db.add(movement)
            
            # Update product stock
            product = await self.db.get(Product, movement_data.product_id)
            if product:
                if movement_data.movement_type in [StockMovementType.INBOUND, StockMovementType.RETURN]:
                    product.current_stock += movement_data.quantity
                elif movement_data.movement_type in [StockMovementType.OUTBOUND, StockMovementType.DAMAGE, StockMovementType.LOSS]:
                    product.current_stock -= movement_data.quantity
                
                # Update last restocked date for inbound movements
                if movement_data.movement_type == StockMovementType.INBOUND:
                    product.last_restocked = datetime.utcnow()
                
                # Check for stock alerts
                await self._check_stock_alerts(product)
            
            await self.db.commit()
            await self.db.refresh(movement)
            
            return self._serialize_stock_movement(movement)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating stock movement: {e}")
            raise
    
    async def get_stock_movements(
        self, 
        page: int = 1, 
        limit: int = 50,
        product_id: Optional[int] = None,
        warehouse_id: Optional[int] = None,
        movement_type: Optional[StockMovementType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict]:
        """Get paginated stock movements with filters"""
        try:
            offset = (page - 1) * limit
            
            query = select(StockMovement)
            
            # Apply filters
            filters = []
            if product_id:
                filters.append(StockMovement.product_id == product_id)
            if warehouse_id:
                filters.append(StockMovement.warehouse_id == warehouse_id)
            if movement_type:
                filters.append(StockMovement.movement_type == movement_type)
            if start_date:
                filters.append(StockMovement.created_at >= start_date)
            if end_date:
                filters.append(StockMovement.created_at <= end_date)
            
            if filters:
                query = query.where(and_(*filters))
            
            query = query.order_by(desc(StockMovement.created_at)).offset(offset).limit(limit)
            
            result = await self.db.execute(query)
            movements = result.scalars().all()
            
            return [self._serialize_stock_movement(movement) for movement in movements]
        except Exception as e:
            print(f"Error getting stock movements: {e}")
            return []
    
    # Demand Forecasting
    async def create_demand_forecast(self, forecast_data: DemandForecastCreate) -> Dict:
        """Create a demand forecast"""
        try:
            forecast = DemandForecast(
                product_id=forecast_data.product_id,
                forecast_period=forecast_data.forecast_period,
                forecast_date=forecast_data.forecast_date,
                forecasted_quantity=forecast_data.forecasted_quantity,
                confidence_level=forecast_data.confidence_level,
                historical_demand=forecast_data.historical_demand,
                seasonal_factors=forecast_data.seasonal_factors,
                forecast_method=forecast_data.forecast_method,
                model_parameters=forecast_data.model_parameters
            )
            
            self.db.add(forecast)
            await self.db.commit()
            await self.db.refresh(forecast)
            
            return self._serialize_demand_forecast(forecast)
        except Exception as e:
            await self.db.rollback()
            print(f"Error creating demand forecast: {e}")
            raise
    
    async def get_demand_forecasts(self, product_id: Optional[int] = None) -> List[Dict]:
        """Get demand forecasts"""
        try:
            query = select(DemandForecast)
            if product_id:
                query = query.where(DemandForecast.product_id == product_id)
            
            query = query.order_by(desc(DemandForecast.forecast_date))
            
            result = await self.db.execute(query)
            forecasts = result.scalars().all()
            
            return [self._serialize_demand_forecast(forecast) for forecast in forecasts]
        except Exception as e:
            print(f"Error getting demand forecasts: {e}")
            return []
    
    # Analytics
    async def get_inventory_analytics(self, period_days: int = 30) -> Dict:
        """Get inventory analytics for the specified period"""
        try:
            start_date = datetime.utcnow() - timedelta(days=period_days)
            
            # Get basic metrics
            total_products_result = await self.db.execute(select(func.count(Product.id)))
            total_products = total_products_result.scalar_one_or_none() or 0
            
            # Calculate total inventory value
            total_value_result = await self.db.execute(
                select(func.sum(Product.current_stock * Product.cost_price))
            )
            total_value = total_value_result.scalar_one_or_none() or 0.0
            
            # Count low stock items
            low_stock_result = await self.db.execute(
                select(func.count(Product.id))
                .where(Product.current_stock <= Product.reorder_point)
            )
            low_stock_items = low_stock_result.scalar_one_or_none() or 0
            
            # Count out of stock items
            out_of_stock_result = await self.db.execute(
                select(func.count(Product.id))
                .where(Product.current_stock == 0)
            )
            out_of_stock_items = out_of_stock_result.scalar_one_or_none() or 0
            
            # Count overstock items
            overstock_result = await self.db.execute(
                select(func.count(Product.id))
                .where(Product.current_stock > Product.max_stock_level)
            )
            overstock_items = overstock_result.scalar_one_or_none() or 0
            
            return {
                "period_days": period_days,
                "total_products": total_products,
                "total_value": float(total_value),
                "low_stock_items": low_stock_items,
                "out_of_stock_items": out_of_stock_items,
                "overstock_items": overstock_items,
                "stock_turnover_rate": 0.0,  # TODO: Implement
                "top_moving_products": [],  # TODO: Implement
                "stock_value_by_category": [],  # TODO: Implement
                "warehouse_utilization": [],  # TODO: Implement
                "demand_forecast_accuracy": 0.0  # TODO: Implement
            }
        except Exception as e:
            print(f"Error getting inventory analytics: {e}")
            return {
                "period_days": period_days,
                "total_products": 0,
                "total_value": 0.0,
                "low_stock_items": 0,
                "out_of_stock_items": 0,
                "overstock_items": 0,
                "stock_turnover_rate": 0.0,
                "top_moving_products": [],
                "stock_value_by_category": [],
                "warehouse_utilization": [],
                "demand_forecast_accuracy": 0.0
            }
    
    async def get_stock_level_report(self) -> List[Dict]:
        """Get stock level report for all products"""
        try:
            query = select(Product)
            result = await self.db.execute(query)
            products = result.scalars().all()
            
            report = []
            for product in products:
                # Calculate days of supply (simplified)
                days_of_supply = None
                if product.current_stock > 0:
                    # This would need historical sales data for accurate calculation
                    days_of_supply = 30  # Placeholder
                
                # Calculate stock value
                stock_value = float(product.current_stock * (product.cost_price or 0))
                
                # Determine status
                if product.current_stock == 0:
                    status = "out_of_stock"
                elif product.current_stock <= product.reorder_point:
                    status = "low_stock"
                elif product.current_stock > product.max_stock_level:
                    status = "overstock"
                else:
                    status = "normal"
                
                report.append({
                    "product_id": product.id,
                    "product_name": product.name,
                    "sku": product.sku,
                    "current_stock": product.current_stock,
                    "min_stock_level": product.min_stock_level,
                    "max_stock_level": product.max_stock_level,
                    "reorder_point": product.reorder_point,
                    "reorder_quantity": product.reorder_quantity,
                    "status": status,
                    "last_movement_date": None,  # TODO: Get from stock movements
                    "stock_value": stock_value,
                    "days_of_supply": days_of_supply
                })
            
            return report
        except Exception as e:
            print(f"Error getting stock level report: {e}")
            return []
    
    # Helper Methods
    async def _check_stock_alerts(self, product: Product):
        """Check and create stock alerts if needed"""
        try:
            # Check for low stock alert
            if product.current_stock <= product.reorder_point and product.current_stock > 0:
                alert = InventoryAlert(
                    product_id=product.id,
                    alert_type="low_stock",
                    severity="medium",
                    message=f"Product {product.name} is running low on stock",
                    current_stock=product.current_stock,
                    threshold_value=product.reorder_point
                )
                self.db.add(alert)
            
            # Check for out of stock alert
            elif product.current_stock == 0:
                alert = InventoryAlert(
                    product_id=product.id,
                    alert_type="out_of_stock",
                    severity="high",
                    message=f"Product {product.name} is out of stock",
                    current_stock=product.current_stock,
                    threshold_value=0
                )
                self.db.add(alert)
            
            # Check for overstock alert
            elif product.current_stock > product.max_stock_level:
                alert = InventoryAlert(
                    product_id=product.id,
                    alert_type="overstock",
                    severity="low",
                    message=f"Product {product.name} is overstocked",
                    current_stock=product.current_stock,
                    threshold_value=product.max_stock_level
                )
                self.db.add(alert)
                
        except Exception as e:
            print(f"Error checking stock alerts: {e}")
    
    # Serialization methods
    def _serialize_product(self, product: Product) -> Dict:
        """Serialize product to dict"""
        return {
            "id": product.id,
            "sku": product.sku,
            "name": product.name,
            "description": product.description,
            "category_id": product.category_id,
            "warehouse_id": product.warehouse_id,
            "brand": product.brand,
            "model": product.model,
            "color": product.color,
            "size": product.size,
            "weight": product.weight,
            "dimensions": product.dimensions,
            "cost_price": float(product.cost_price) if product.cost_price else None,
            "selling_price": float(product.selling_price) if product.selling_price else None,
            "msrp": float(product.msrp) if product.msrp else None,
            "current_stock": product.current_stock,
            "min_stock_level": product.min_stock_level,
            "max_stock_level": product.max_stock_level,
            "reorder_point": product.reorder_point,
            "reorder_quantity": product.reorder_quantity,
            "status": product.status.value if product.status else None,
            "is_trackable": product.is_trackable,
            "is_serialized": product.is_serialized,
            "barcode": product.barcode,
            "tags": product.tags,
            "last_restocked": product.last_restocked.isoformat() if product.last_restocked else None,
            "created_at": product.created_at.isoformat() if product.created_at else None,
            "updated_at": product.updated_at.isoformat() if product.updated_at else None
        }
    
    def _serialize_stock_movement(self, movement: StockMovement) -> Dict:
        """Serialize stock movement to dict"""
        return {
            "id": movement.id,
            "product_id": movement.product_id,
            "warehouse_id": movement.warehouse_id,
            "movement_type": movement.movement_type.value if movement.movement_type else None,
            "quantity": movement.quantity,
            "unit_cost": float(movement.unit_cost) if movement.unit_cost else None,
            "total_cost": float(movement.total_cost) if movement.total_cost else None,
            "reference_number": movement.reference_number,
            "reference_type": movement.reference_type,
            "reference_id": movement.reference_id,
            "reason": movement.reason,
            "notes": movement.notes,
            "serial_numbers": movement.serial_numbers,
            "created_by": movement.created_by,
            "created_at": movement.created_at.isoformat() if movement.created_at else None
        }
    
    def _serialize_demand_forecast(self, forecast: DemandForecast) -> Dict:
        """Serialize demand forecast to dict"""
        return {
            "id": forecast.id,
            "product_id": forecast.product_id,
            "forecast_period": forecast.forecast_period,
            "forecast_date": forecast.forecast_date.isoformat() if forecast.forecast_date else None,
            "forecasted_quantity": forecast.forecasted_quantity,
            "confidence_level": forecast.confidence_level,
            "historical_demand": forecast.historical_demand,
            "seasonal_factors": forecast.seasonal_factors,
            "forecast_method": forecast.forecast_method,
            "model_parameters": forecast.model_parameters,
            "mape": forecast.mape,
            "rmse": forecast.rmse,
            "created_at": forecast.created_at.isoformat() if forecast.created_at else None,
            "updated_at": forecast.updated_at.isoformat() if forecast.updated_at else None
        }



