const prisma = require("../utills/db");
const { asyncHandler } = require("../utills/errorHandler");

const MONTHS_TO_SHOW = 6;

const formatMonthKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
};

const formatMonthLabel = (date) =>
  date.toLocaleString("en-US", { month: "short", year: "numeric" });

const getMonthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const buildMonthSeries = () => {
  const months = [];
  const now = new Date();

  for (let offset = MONTHS_TO_SHOW - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push({
      key: formatMonthKey(date),
      label: formatMonthLabel(date),
      start: new Date(date),
      end: new Date(date.getFullYear(), date.getMonth() + 1, 1),
    });
  }

  return months;
};

const getPercentageDelta = (current, previous) => {
  if (!previous) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
};

const getDashboardAnalytics = asyncHandler(async (_request, response) => {
  const months = buildMonthSeries();
  const now = new Date();
  const thisMonthStart = getMonthStart(now);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [orders, products, users, groupedOrderItems] = await Promise.all([
    prisma.customer_order.findMany({
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                price: true,
                mainImage: true,
                slug: true,
                inStock: true,
              },
            },
          },
        },
      },
      orderBy: {
        dateTime: "desc",
      },
    }),
    prisma.product.findMany({
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
      },
    }),
    prisma.customer_order_product.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    }),
  ]);

  const productMap = new Map(products.map((product) => [product.id, product]));
  const customerEmails = new Set();
  const firstOrderPerCustomer = new Map();

  const monthlySales = months.map((month) => ({
    month: month.label,
    revenue: 0,
    orders: 0,
  }));

  for (const order of orders) {
    const orderDate = order.dateTime ? new Date(order.dateTime) : null;

    if (order.email) {
      customerEmails.add(order.email.toLowerCase());
    }

    if (orderDate) {
      const key = order.email?.toLowerCase();
      const monthKey = formatMonthKey(orderDate);
      const monthIndex = months.findIndex((month) => month.key === monthKey);

      if (monthIndex >= 0) {
        monthlySales[monthIndex].revenue += order.total;
        monthlySales[monthIndex].orders += 1;
      }

      if (key && !firstOrderPerCustomer.has(key)) {
        firstOrderPerCustomer.set(key, orderDate);
      }
    }
  }

  const userGrowth = months.map((month) => ({
    month: month.label,
    customers: 0,
  }));

  for (const [, firstOrderDate] of firstOrderPerCustomer.entries()) {
    const monthKey = formatMonthKey(firstOrderDate);
    const monthIndex = months.findIndex((month) => month.key === monthKey);

    if (monthIndex >= 0) {
      userGrowth[monthIndex].customers += 1;
    }
  }

  let totalCustomersToDate = 0;
  for (const point of userGrowth) {
    totalCustomersToDate += point.customers;
    point.customers = totalCustomersToDate;
  }

  const ordersThisMonth = orders.filter((order) => {
    if (!order.dateTime) {
      return false;
    }

    const orderDate = new Date(order.dateTime);
    return orderDate >= thisMonthStart;
  });

  const ordersPreviousMonth = orders.filter((order) => {
    if (!order.dateTime) {
      return false;
    }

    const orderDate = new Date(order.dateTime);
    return orderDate >= previousMonthStart && orderDate < thisMonthStart;
  });

  const revenueThisMonth = ordersThisMonth.reduce((sum, order) => sum + order.total, 0);
  const revenuePreviousMonth = ordersPreviousMonth.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const customersThisMonth = new Set(
    ordersThisMonth.map((order) => order.email?.toLowerCase()).filter(Boolean)
  ).size;
  const customersPreviousMonth = new Set(
    ordersPreviousMonth.map((order) => order.email?.toLowerCase()).filter(Boolean)
  ).size;

  const topProducts = groupedOrderItems.map((item) => {
    const product = productMap.get(item.productId);
    const unitsSold = item._sum.quantity || 0;
    const revenue = (product?.price || 0) * unitsSold;

    return {
      id: item.productId,
      title: product?.title || "Deleted product",
      slug: product?.slug || "",
      image: product?.mainImage || "",
      category: product?.category?.name || "Uncategorized",
      unitsSold,
      revenue,
      stock: product?.inStock ?? 0,
    };
  });

  const recentOrders = orders.slice(0, 5).map((order) => ({
    id: order.id,
    customerName: `${order.name} ${order.lastname}`.trim(),
    email: order.email,
    country: order.country,
    status: order.status,
    total: order.total,
    dateTime: order.dateTime,
    itemsCount: order.products.reduce((sum, item) => sum + item.quantity, 0),
  }));

  const analyticsPayload = {
    summary: {
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      totalOrders: orders.length,
      totalCustomers: customerEmails.size,
      totalUsers: users.length,
      activeProducts: products.filter((product) => product.inStock > 0).length,
      outOfStockProducts: products.filter((product) => product.inStock <= 0).length,
      lowStockProducts: products.filter(
        (product) => product.inStock > 0 && product.inStock <= 5
      ).length,
      revenueDelta: getPercentageDelta(revenueThisMonth, revenuePreviousMonth),
      orderDelta: getPercentageDelta(
        ordersThisMonth.length,
        ordersPreviousMonth.length
      ),
      customerDelta: getPercentageDelta(
        customersThisMonth,
        customersPreviousMonth
      ),
    },
    monthlySales,
    userGrowth,
    topProducts,
    recentOrders,
  };

  return response.status(200).json(analyticsPayload);
});

module.exports = {
  getDashboardAnalytics,
};
