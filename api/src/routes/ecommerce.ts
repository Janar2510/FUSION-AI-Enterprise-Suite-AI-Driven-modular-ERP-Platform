import { Router } from 'express';
import prisma from '../lib/prisma';
import { asyncHandler } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';

export const ecommerceRoutes = Router();

// Get or create cart
ecommerceRoutes.post('/cart/:sessionId', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    let cart = await prisma.webCart.findUnique({
        where: { sessionId },
        include: { items: { include: { product: true } } }
    });

    if (!cart) {
        cart = await prisma.webCart.create({
            data: { sessionId },
            include: { items: { include: { product: true } } }
        });
    }

    // Map to snake_case for frontend
    res.json({
        id: cart.id,
        session_id: cart.sessionId,
        status: cart.status,
        subtotal: cart.subtotal,
        tax_amount: cart.taxAmount,
        discount_amount: cart.discount,
        total_amount: cart.totalAmount,
        items: cart.items.map(item => ({
            id: item.id,
            product_id: item.productId,
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            line_total: item.lineTotal
        }))
    });
}));

// Add item to cart
ecommerceRoutes.post('/cart/:sessionId/items', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { productId, quantity = 1 } = req.body;

    let cart = await prisma.webCart.findUnique({ where: { sessionId } });
    if (!cart) {
        cart = await prisma.webCart.create({ data: { sessionId } });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
    }

    const existingItem = await prisma.webCartItem.findFirst({
        where: { cartId: cart.id, productId }
    });

    const unitPrice = product.salePrice || 0;

    if (existingItem) {
        await prisma.webCartItem.update({
            where: { id: existingItem.id },
            data: {
                quantity: existingItem.quantity + quantity,
                lineTotal: (existingItem.quantity + quantity) * unitPrice
            }
        });
    } else {
        await prisma.webCartItem.create({
            data: {
                cartId: cart.id,
                productId,
                productName: product.name,
                productSku: product.internalRef || '',
                quantity,
                unitPrice,
                lineTotal: quantity * unitPrice
            }
        });
    }

    // Recalculate cart
    const items = await prisma.webCartItem.findMany({ where: { cartId: cart.id } });
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const taxAmount = subtotal * 0.1;
    const totalAmount = subtotal + taxAmount;

    const updatedCart = await prisma.webCart.update({
        where: { id: cart.id },
        data: { subtotal, taxAmount, totalAmount },
        include: { items: { include: { product: true } } }
    });

    // Map to snake_case for frontend
    res.json({
        id: updatedCart.id,
        session_id: updatedCart.sessionId,
        status: updatedCart.status,
        subtotal: updatedCart.subtotal,
        tax_amount: updatedCart.taxAmount,
        discount_amount: updatedCart.discount,
        total_amount: updatedCart.totalAmount,
        items: updatedCart.items.map(item => ({
            id: item.id,
            product_id: item.productId,
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            line_total: item.lineTotal
        }))
    });
}));

// Checkout
ecommerceRoutes.post('/cart/:sessionId/checkout', asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { email, name } = req.body;

    const cart = await prisma.webCart.findUnique({
        where: { sessionId },
        include: { items: true }
    });

    if (!cart || cart.items.length === 0) {
        res.status(400).json({ error: 'Cart is empty' });
        return;
    }

    const orderNumber = `WEB-${Date.now()}`;

    // 1. Create SaleOrder
    let partner = await prisma.partner.findFirst({ where: { email } });
    if (!partner) {
        partner = await prisma.partner.create({
            data: { name, email, isCustomer: true }
        });
    }

    const saleOrder = await prisma.saleOrder.create({
        data: {
            name: orderNumber,
            partnerId: partner.id,
            amountUntaxed: cart.subtotal,
            amountTax: cart.taxAmount,
            amountTotal: cart.totalAmount,
            state: 'draft',
            lines: {
                create: cart.items.map(item => ({
                    name: item.productName,
                    productId: item.productId,
                    productQty: item.quantity,
                    priceUnit: item.unitPrice,
                    priceSubtotal: item.lineTotal,
                    priceTotal: item.lineTotal
                }))
            }
        }
    });

    // 2. Create WebOrder
    const webOrder = await prisma.webOrder.create({
        data: {
            orderNumber,
            saleOrderId: saleOrder.id,
            cartId: cart.id,
            gatewayStatus: 'paid'
        }
    });

    // 3. Close Cart
    await prisma.webCart.update({
        where: { id: cart.id },
        data: { status: 'completed' }
    });

    res.json({
        id: webOrder.id,
        order_number: webOrder.orderNumber,
        sale_order_id: webOrder.saleOrderId,
        cart_id: webOrder.cartId,
        gateway_status: webOrder.gatewayStatus
    });
}));

// Advanced AI Recommendations (Real-World Patterns)
ecommerceRoutes.post('/ai/recommendations', asyncHandler(async (req, res) => {
    const { sessionId } = req.body;

    // 1. Get current cart items
    const cart = await prisma.webCart.findUnique({
        where: { sessionId },
        include: { items: true }
    });

    const currentProductIds = cart?.items.map(item => item.productId) || [];

    let recommendations: any[] = [];

    if (currentProductIds.length > 0) {
        // Find orders that contain ANY of the current products
        const relatedSaleOrders = await prisma.saleOrder.findMany({
            where: {
                lines: {
                    some: { productId: { in: currentProductIds } }
                }
            },
            include: { lines: true }
        });

        const relatedPosOrders = await prisma.posOrder.findMany({
            where: {
                lines: {
                    some: { productId: { in: currentProductIds } }
                }
            },
            include: { lines: true }
        });

        // Extract and count other products from these orders
        const productCounts: Record<number, number> = {};

        [...relatedSaleOrders, ...relatedPosOrders].forEach(order => {
            order.lines.forEach(line => {
                if (line.productId && !currentProductIds.includes(line.productId)) {
                    productCounts[line.productId] = (productCounts[line.productId] || 0) + 1;
                }
            });
        });

        const sortedProductIds = Object.entries(productCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .map(([id]) => parseInt(id));

        if (sortedProductIds.length > 0) {
            recommendations = await prisma.product.findMany({
                where: { id: { in: sortedProductIds } }
            });
        }
    }

    // Fallback: popularity or general recommendations
    if (recommendations.length < 4) {
        const fallback = await prisma.product.findMany({
            where: {
                id: { notIn: currentProductIds.concat(recommendations.map(p => p.id)) }
            },
            take: 4 - recommendations.length,
            orderBy: { createdAt: 'desc' } // Proxy for popularity for now
        });
        recommendations = [...recommendations, ...fallback];
    }

    res.json(recommendations);
}));

// AI Cart Abandonment Recovery
ecommerceRoutes.get('/ai/cart-abandonment', asyncHandler(async (req, res) => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Find active carts older than 1 hour
    const abandonedCarts = await prisma.webCart.findMany({
        where: {
            status: 'active',
            updatedAt: { lt: oneHourAgo },
            items: { some: {} } // Must have items
        },
        include: {
            items: true,
            // customerId is a field in WebCart in schema
        }
    });

    res.json(abandonedCarts.map(cart => ({
        id: cart.id,
        session_id: cart.sessionId,
        updated_at: cart.updatedAt,
        total_amount: cart.totalAmount,
        item_count: cart.items.length,
        items: cart.items.map(i => i.productName),
        customer_id: cart.customerId
    })));
}));

ecommerceRoutes.post('/ai/cart-abandonment/recover', asyncHandler(async (req, res) => {
    const { cartId } = req.body;

    // Mock the AI Agent recovery process
    // In a real app, this would trigger an email, push notification, or specific discount code generation

    const cart = await prisma.webCart.findUnique({
        where: { id: cartId }
    });

    if (!cart) {
        res.status(404).json({ error: 'Cart not found' });
        return;
    }

    // Mark as recovery_sent
    await prisma.webCart.update({
        where: { id: cartId },
        data: { status: 'recovery_sent' }
    });

    res.json({
        success: true,
        message: 'Recovery agent dispatched. Discount incentive sent to customer.',
        strategy: 'abandoned_cart_incentive_v1'
    });
}));
