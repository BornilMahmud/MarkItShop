const express = require('express');

const router = express.Router();

  const {
    getCustomerOrder,
    createCustomerOrder,
    createCheckoutOrder,
    updateCustomerOrder,
    deleteCustomerOrder,
    getAllOrders,
    getOrdersByCustomerEmail,
  } = require('../controllers/customer_orders');

  router.get('/history', getOrdersByCustomerEmail);
  router.post('/checkout', createCheckoutOrder);

  router.route('/')
  .get(getAllOrders)
  .post(createCustomerOrder);

  router.route('/:id')
  .get(getCustomerOrder)
  .put(updateCustomerOrder) 
  .delete(deleteCustomerOrder); 


  module.exports = router;
