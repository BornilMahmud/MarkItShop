const prisma = require("../utills/db");
const { validateOrderData, ValidationError } = require('../utills/validation');
const { createOrderUpdateNotification } = require('../utills/notificationHelpers');
const { sendOrderConfirmationEmail } = require('../services/orderEmailService');

const SHIPPING_CHARGE_BDT = 130;
const CURRENCY_BDT = 'BDT';

const normalizeOrderStatus = (status = "pending") => {
  const normalized = `${status}`.trim().toLowerCase();
  if (normalized === "cancelled") {
    return "canceled";
  }
  return normalized;
};

async function createCheckoutOrder(request, response) {
  try {
    const paymentMethod = `${request.body?.paymentMethod || ""}`.trim().toLowerCase();
    const paymentPhone = `${request.body?.paymentPhone || ""}`.trim();
    const transactionId = `${request.body?.transactionId || ""}`.trim();
    const fullName = `${request.body?.fullName || ""}`.trim();
    const phone = `${request.body?.phone || ""}`.trim();
    const email = `${request.body?.email || ""}`.trim().toLowerCase();
    const adress = `${request.body?.adress || ""}`.trim();
    const city = `${request.body?.city || ""}`.trim();

    const [firstName, ...lastNameParts] = fullName.split(/\s+/);
    const lastNameFromFullName = lastNameParts.join(" ");

    if (!fullName) {
      return response.status(400).json({
        error: "Validation failed",
        details: [{ field: "fullName", message: "Full name is required" }],
      });
    }

    if (!phone) {
      return response.status(400).json({
        error: "Validation failed",
        details: [{ field: "phone", message: "Phone number is required" }],
      });
    }

    if (!email) {
      return response.status(400).json({
        error: "Validation failed",
        details: [{ field: "email", message: "Email is required" }],
      });
    }

    if (!adress || !city) {
      return response.status(400).json({
        error: "Validation failed",
        details: [{ field: "address", message: "City and address are required" }],
      });
    }

    if (!paymentMethod || !["bkash", "nagad", "rocket"].includes(paymentMethod)) {
      return response.status(400).json({
        error: "Validation failed",
        details: [{ field: "paymentMethod", message: "Valid mobile banking method is required" }],
      });
    }

    if (!paymentPhone) {
      return response.status(400).json({
        error: "Validation failed",
        details: [{ field: "paymentPhone", message: "Mobile banking number is required" }],
      });
    }

    if (!transactionId) {
      return response.status(400).json({
        error: "Validation failed",
        details: [{ field: "transactionId", message: "Transaction ID is required" }],
      });
    }

    const items = Array.isArray(request.body?.items) ? request.body.items : [];

    if (items.length === 0) {
      return response.status(400).json({
        error: "Cart is empty",
        details: "At least one product is required to place an order.",
      });
    }

    const normalizedItems = items.map((item) => ({
      productId: `${item.productId || ""}`.trim(),
      quantity: Number(item.quantity || 0),
    }));

    if (normalizedItems.some((item) => !item.productId || item.quantity <= 0)) {
      return response.status(400).json({
        error: "Invalid order items",
        details: "Each item must include a valid productId and quantity.",
      });
    }

    const productIds = normalizedItems.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    if (products.length !== productIds.length) {
      return response.status(404).json({
        error: "One or more products could not be found",
      });
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const stockIssue = normalizedItems.find((item) => {
      const product = productMap.get(item.productId);
      return !product || product.inStock < item.quantity;
    });

    if (stockIssue) {
      const product = productMap.get(stockIssue.productId);
      return response.status(409).json({
        error: "Inventory unavailable",
        details: `${product?.title || "Product"} does not have enough stock for this order.`,
      });
    }

    const normalizedOrderData = {
      name: firstName || "Customer",
      lastname: lastNameFromFullName || "",
      phone,
      email,
      company: `${request.body?.company || "MarkItShop"}`.trim() || "MarkItShop",
      adress,
      apartment: `${request.body?.apartment || "N/A"}`.trim() || "N/A",
      postalCode: `${request.body?.postalCode || "0000"}`.trim() || "0000",
      status: normalizeOrderStatus(request.body?.status || "pending"),
      city,
      country: `${request.body?.country || "Bangladesh"}`.trim() || "Bangladesh",
      orderNotice: `${request.body?.orderNotice || ""}`.trim(),
      paymentMethod,
      paymentPhone,
      transactionId,
    };

    const subtotal = normalizedItems.reduce((sum, item) => {
      const product = productMap.get(item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
    const finalTotal = subtotal + SHIPPING_CHARGE_BDT;

    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.customer_order.create({
        data: {
          name: normalizedOrderData.name,
          lastname: normalizedOrderData.lastname,
          phone: normalizedOrderData.phone,
          email: normalizedOrderData.email,
          company: normalizedOrderData.company,
          adress: normalizedOrderData.adress,
          apartment: normalizedOrderData.apartment,
          postalCode: normalizedOrderData.postalCode,
          status: normalizedOrderData.status,
          city: normalizedOrderData.city,
          country: normalizedOrderData.country,
          orderNotice: normalizedOrderData.orderNotice,
          paymentMethod: normalizedOrderData.paymentMethod,
          paymentPhone: normalizedOrderData.paymentPhone,
          transactionId: normalizedOrderData.transactionId,
          shippingCharge: SHIPPING_CHARGE_BDT,
          currency: CURRENCY_BDT,
          total: finalTotal,
          dateTime: new Date(),
        },
      });

      await tx.customer_order_product.createMany({
        data: normalizedItems.map((item) => ({
          customerOrderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      for (const item of normalizedItems) {
        await tx.product.update({
          where: {
            id: item.productId,
          },
          data: {
            inStock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return order;
    });

    try {
      let user = null;

      if (request.body.userId) {
        user = await prisma.user.findUnique({
          where: { id: request.body.userId },
        });
      }

      if (!user) {
        user = await prisma.user.findUnique({
          where: { email: normalizedOrderData.email },
        });
      }

      if (user) {
        await createOrderUpdateNotification(
          user.id,
          "confirmed",
          createdOrder.id,
          finalTotal
        );
      }
    } catch (notificationError) {
      console.error("Failed to create order notification:", notificationError);
    }

    let emailSent = false;
    try {
      // Prepare itemized list for email
      const itemsForEmail = normalizedItems.map((item) => {
        const product = productMap.get(item.productId);
        return {
          title: product?.title || 'Unknown Product',
          quantity: item.quantity,
          price: product?.price || 0,
        };
      });

      emailSent = await sendOrderConfirmationEmail({
        to: normalizedOrderData.email,
        customerName: `${normalizedOrderData.name} ${normalizedOrderData.lastname}`.trim(),
        orderId: createdOrder.id,
        orderDate: new Date().toLocaleDateString(),
        total: finalTotal,
        subtotal: subtotal,
        shippingCharge: SHIPPING_CHARGE_BDT,
        paymentMethod: normalizedOrderData.paymentMethod,
        paymentPhone: normalizedOrderData.paymentPhone,
        transactionId: normalizedOrderData.transactionId,
        address: normalizedOrderData.adress,
        apartment: normalizedOrderData.apartment,
        city: normalizedOrderData.city,
        country: normalizedOrderData.country,
        postalCode: normalizedOrderData.postalCode,
        phone: normalizedOrderData.phone,
        items: itemsForEmail,
      });
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
    }

    return response.status(201).json({
      id: createdOrder.id,
      message: "Order created successfully",
      orderNumber: createdOrder.id,
      total: finalTotal,
      currency: CURRENCY_BDT,
      emailSent,
    });
  } catch (error) {
    console.error("Error creating checkout order:", error);
    return response.status(500).json({
      error: "Internal server error",
      details: "Failed to create order. Please try again later.",
    });
  }
}

async function createCustomerOrder(request, response) {
  try {
    console.log("=== ORDER CREATION REQUEST ===");
    console.log("Request body:", JSON.stringify(request.body, null, 2));
    
    // Validate request body
    if (!request.body || typeof request.body !== 'object') {
      console.log("❌ Invalid request body");
      return response.status(400).json({ 
        error: "Invalid request body",
        details: "Request body must be a valid JSON object"
      });
    }

    // Server-side validation
    const validation = validateOrderData({
      ...request.body,
      paymentMethod: request.body.paymentMethod || 'bkash',
      paymentPhone: request.body.paymentPhone || request.body.phone,
      transactionId: request.body.transactionId || `manual-${Date.now()}`,
    });
    console.log("Validation result:", validation);
    
    if (!validation.isValid) {
      console.log("❌ Validation failed:", validation.errors);
      return response.status(400).json({
        error: "Validation failed",
        details: validation.errors
      });
    }

    const validatedData = validation.validatedData;
    console.log("✅ Validation passed, validated data:", validatedData);

    // Additional business logic validation
    if (validatedData.total < 0.01) {
      console.log("❌ Invalid total amount");
      return response.status(400).json({
        error: "Invalid order total",
        details: [{ field: 'total', message: 'Order total must be at least 1 BDT' }]
      });
    }

    // Check for duplicate orders (same email and total within last 1 minute) - less strict
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
    const duplicateOrder = await prisma.customer_order.findFirst({
      where: {
        email: validatedData.email,
        total: validatedData.total,
        dateTime: {
          gte: oneMinuteAgo
        }
      }
    });

    if (duplicateOrder) {
      console.log("❌ Duplicate order detected (same email, amount, within 1 minute)");
      return response.status(409).json({
        error: "Duplicate order detected",
        details: "An identical order was just created. Please wait a moment before creating another order with the same details."
      });
    }

    console.log("Creating order in database...");
    // Create the order with validated data
    const corder = await prisma.customer_order.create({
      data: {
        name: validatedData.name,
        lastname: validatedData.lastname,
        phone: validatedData.phone,
        email: validatedData.email,
        company: validatedData.company,
        adress: validatedData.adress,
        apartment: validatedData.apartment,
        postalCode: validatedData.postalCode,
        status: normalizeOrderStatus(validatedData.status),
        city: validatedData.city,
        country: validatedData.country,
        orderNotice: validatedData.orderNotice,
          paymentMethod: validatedData.paymentMethod,
          paymentPhone: validatedData.paymentPhone,
          transactionId: validatedData.transactionId,
          shippingCharge: SHIPPING_CHARGE_BDT,
          currency: CURRENCY_BDT,
        total: validatedData.total,
        dateTime: new Date()
      },
    });

    console.log("✅ Order created successfully:", corder);
    console.log("Order ID:", corder.id);

    // Create notification for the user if they have an account
    try {
      let user = null;
      
      // First, try to use userId if provided (from logged-in user)
      if (request.body.userId) {
        console.log(`🔍 Using provided userId: ${request.body.userId}`);
        user = await prisma.user.findUnique({
          where: { id: request.body.userId }
        });
        if (user) {
          console.log(`✅ Found user by ID: ${user.email}`);
        } else {
          console.log(`❌ User not found with ID: ${request.body.userId}`);
        }
      }
      
      // Fallback: search by email if no userId or user not found
      if (!user) {
        console.log(`🔍 Searching user by email: ${validatedData.email}`);
        user = await prisma.user.findUnique({
          where: { email: validatedData.email }
        });
        if (user) {
          console.log(`✅ Found user by email: ${user.email}`);
        }
      }
      
      if (user) {
        await createOrderUpdateNotification(
          user.id,
          'confirmed',
          corder.id,
          validatedData.total
        );
        console.log(`📧 Order confirmation notification sent to user: ${user.email}`);
      } else {
        console.log(`ℹ️  No user account found for email: ${validatedData.email} - notification skipped`);
      }
    } catch (notificationError) {
      console.error('❌ Failed to create order notification:', notificationError);
      // Don't fail the order if notification fails
    }

    // Log successful order creation (for monitoring)
    console.log(`Order created successfully: ID ${corder.id}, Email: ${validatedData.email}, Total: ${validatedData.total} BDT`);

    const responseData = {
      id: corder.id,
      message: "Order created successfully",
      orderNumber: corder.id
    };
    
    console.log("Sending response:", responseData);
    return response.status(201).json(responseData);

  } catch (error) {
    console.error("❌ Error creating order:", error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return response.status(409).json({ 
        error: "Order conflict",
        details: "An order with this information already exists"
      });
    }

    // Handle validation errors
    if (error instanceof ValidationError) {
      return response.status(400).json({
        error: "Validation failed",
        details: [{ field: error.field, message: error.message }]
      });
    }

    // Generic error response
    return response.status(500).json({ 
      error: "Internal server error",
      details: "Failed to create order. Please try again later."
    });
  }
}

async function updateCustomerOrder(request, response) {
  try {
    const { id } = request.params;
    
    // Validate ID format
    if (!id || typeof id !== 'string') {
      return response.status(400).json({
        error: "Invalid order ID",
        details: "Order ID must be provided"
      });
    }

    // Validate request body
    if (!request.body || typeof request.body !== 'object') {
      return response.status(400).json({ 
        error: "Invalid request body",
        details: "Request body must be a valid JSON object"
      });
    }

    // Server-side validation for update data
    const validation = validateOrderData({
      ...request.body,
      paymentMethod: request.body.paymentMethod || 'bkash',
      paymentPhone: request.body.paymentPhone || request.body.phone,
      transactionId: request.body.transactionId || `manual-${Date.now()}`,
    });
    
    if (!validation.isValid) {
      return response.status(400).json({
        error: "Validation failed",
        details: validation.errors
      });
    }

    const validatedData = validation.validatedData;

    const existingOrder = await prisma.customer_order.findUnique({
      where: {
        id: id,
      },
      include: {
        customer_order_product: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!existingOrder) {
      return response.status(404).json({ 
        error: "Order not found",
        details: "The specified order does not exist"
      });
    }

    const updatedOrder = await prisma.customer_order.update({
      where: {
        id: existingOrder.id,
      },
      data: {
        name: validatedData.name,
        lastname: validatedData.lastname,
        phone: validatedData.phone,
        email: validatedData.email,
        company: validatedData.company,
        adress: validatedData.adress,
        apartment: validatedData.apartment,
        postalCode: validatedData.postalCode,
        status: normalizeOrderStatus(validatedData.status),
        city: validatedData.city,
        country: validatedData.country,
        orderNotice: validatedData.orderNotice,
        paymentMethod: validatedData.paymentMethod,
        paymentPhone: validatedData.paymentPhone,
        transactionId: validatedData.transactionId,
        shippingCharge: request.body.shippingCharge || existingOrder.shippingCharge || SHIPPING_CHARGE_BDT,
        currency: request.body.currency || existingOrder.currency || CURRENCY_BDT,
        total: validatedData.total,
      },
    });

    // Create notification for status update if status changed
    const normalizedNewStatus = normalizeOrderStatus(validatedData.status);
    if (existingOrder.status !== normalizedNewStatus) {
      try {
        const user = await prisma.user.findUnique({
          where: { email: validatedData.email }
        });
        
        if (user) {
          await createOrderUpdateNotification(
            user.id,
            normalizedNewStatus,
            updatedOrder.id,
            validatedData.total
          );
          console.log(`📧 Status update notification sent to user: ${user.email} - Status: ${validatedData.status}`);
        }
      } catch (notificationError) {
        console.error('❌ Failed to create status update notification:', notificationError);
      }

      if (["processing", "delivered"].includes(normalizedNewStatus)) {
        try {
          // Prepare itemized list for email
          const itemsForEmail = (existingOrder.customer_order_product || []).map((orderProduct) => ({
            title: orderProduct.product?.title || 'Unknown Product',
            quantity: orderProduct.quantity,
            price: orderProduct.product?.price || 0,
          }));

          // Calculate subtotal from items
          const emailSubtotal = itemsForEmail.reduce((sum, item) => sum + (item.price * item.quantity), 0);

          await sendOrderConfirmationEmail({
            to: validatedData.email,
            customerName: `${validatedData.name} ${validatedData.lastname}`.trim(),
            orderId: updatedOrder.id,
            orderDate: existingOrder.dateTime ? new Date(existingOrder.dateTime).toLocaleDateString() : new Date().toLocaleDateString(),
            total: updatedOrder.total,
            subtotal: emailSubtotal,
            shippingCharge: updatedOrder.shippingCharge || SHIPPING_CHARGE_BDT,
            paymentMethod: updatedOrder.paymentMethod,
            paymentPhone: updatedOrder.paymentPhone,
            transactionId: updatedOrder.transactionId,
            address: validatedData.adress,
            apartment: validatedData.apartment,
            city: validatedData.city,
            country: validatedData.country,
            postalCode: validatedData.postalCode,
            phone: validatedData.phone,
            items: itemsForEmail,
          });
        } catch (emailError) {
          console.error("Failed to send status confirmation email:", emailError);
        }
      }
    }

    console.log(`Order updated successfully: ID ${updatedOrder.id}`);

    return response.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    
    if (error.code === 'P2025') {
      return response.status(404).json({ 
        error: "Order not found",
        details: "The specified order does not exist"
      });
    }

    if (error instanceof ValidationError) {
      return response.status(400).json({
        error: "Validation failed",
        details: [{ field: error.field, message: error.message }]
      });
    }

    return response.status(500).json({ 
      error: "Internal server error",
      details: "Failed to update order. Please try again later."
    });
  }
}

async function deleteCustomerOrder(request, response) {
  try {
    const { id } = request.params;
    
    if (!id || typeof id !== 'string') {
      return response.status(400).json({
        error: "Invalid order ID",
        details: "Order ID must be provided"
      });
    }

    const existingOrder = await prisma.customer_order.findUnique({
      where: { id: id },
    });

    if (!existingOrder) {
      return response.status(404).json({ 
        error: "Order not found",
        details: "The specified order does not exist"
      });
    }

    await prisma.customer_order.delete({
      where: {
        id: id,
      },
    });

    console.log(`Order deleted successfully: ID ${id}`);
    return response.status(204).send();
  } catch (error) {
    console.error("Error deleting order:", error);
    
    if (error.code === 'P2025') {
      return response.status(404).json({ 
        error: "Order not found",
        details: "The specified order does not exist"
      });
    }

    return response.status(500).json({ 
      error: "Internal server error",
      details: "Failed to delete order. Please try again later."
    });
  }
}

async function getCustomerOrder(request, response) {
  try {
    const { id } = request.params;
    
    if (!id || typeof id !== 'string') {
      return response.status(400).json({
        error: "Invalid order ID",
        details: "Order ID must be provided"
      });
    }

    const order = await prisma.customer_order.findUnique({
      where: {
        id: id,
      },
    });
    
    if (!order) {
      return response.status(404).json({ 
        error: "Order not found",
        details: "The specified order does not exist"
      });
    }
    
    return response.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return response.status(500).json({ 
      error: "Internal server error",
      details: "Failed to fetch order. Please try again later."
    });
  }
}

async function getAllOrders(request, response) {
  try {
    // Add pagination and filtering for better performance
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return response.status(400).json({
        error: "Invalid pagination parameters",
        details: "Page must be >= 1, limit must be between 1 and 100"
      });
    }

    const [orders, totalCount] = await Promise.all([
      prisma.customer_order.findMany({
        skip: offset,
        take: limit,
        orderBy: {
          dateTime: 'desc'
        }
      }),
      prisma.customer_order.count()
    ]);

    return response.json({
      orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return response.status(500).json({ 
      error: "Internal server error",
      details: "Failed to fetch orders. Please try again later."
    });
  }
}

async function getOrdersByCustomerEmail(request, response) {
  try {
    const rawEmail = `${request.query.email || ""}`.trim();
    const email = rawEmail.toLowerCase();

    if (!email) {
      return response.status(400).json({
        error: "Email is required",
        details: "Provide the customer's email as a query parameter",
      });
    }

    let orders = [];

    try {
      orders = await prisma.customer_order.findMany({
        where: {
          OR: [{ email }, { email: rawEmail }],
        },
        include: {
          products: {
            include: {
              product: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  mainImage: true,
                  price: true,
                  manufacturer: true,
                },
              },
            },
          },
        },
        orderBy: {
          dateTime: "desc",
        },
      });
    } catch (historyError) {
      console.error("Detailed history query failed, using fallback:", historyError);
      orders = await prisma.customer_order.findMany({
        where: {
          OR: [{ email }, { email: rawEmail }],
        },
        orderBy: {
          dateTime: "desc",
        },
      });
    }

    return response.status(200).json({
      orders,
      total: orders.length,
    });
  } catch (error) {
    console.error("Error fetching customer order history:", error);
    return response.status(500).json({
      error: "Internal server error",
      details: "Failed to fetch customer order history. Please try again later.",
    });
  }
}

module.exports = {
  createCustomerOrder,
  createCheckoutOrder,
  updateCustomerOrder,
  deleteCustomerOrder,
  getCustomerOrder,
  getAllOrders,
  getOrdersByCustomerEmail,
};
