import { CustomerOrderHistory, SectionTitle } from "@/components";

const OrdersPage = () => {
  return (
    <div className="bg-white">
      <SectionTitle title="My Orders" path="Home | My Orders" />
      <div className="mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 lg:px-8">
        <CustomerOrderHistory />
      </div>
    </div>
  );
};

export default OrdersPage;
