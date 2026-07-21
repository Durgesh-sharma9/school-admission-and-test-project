const PaymentGatewayService = require('../services/paymentGatewayService');
const School = require('../models/School');
const Plan = require('../models/Plan');

// @desc    Create payment session for subscription
// @route   POST /api/v1/payment/create-session
// @access  School Admin
exports.createPaymentSession = async (req, res) => {
  try {
    const { planId, billingCycle, gateway = 'stripe' } = req.body;
    const school = await School.findById(req.school._id);

    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const paymentService = new PaymentGatewayService(gateway);
    const returnUrl = `${process.env.FRONTEND_URL}/subscription?payment=success`;

    const session = await paymentService.createPaymentSession({
      planId,
      billingCycle,
      schoolId: school._id,
      returnUrl,
    });

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Create payment session error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Handle payment webhook
// @route   POST /api/v1/payment/webhook/:gateway
// @access  Public
exports.handleWebhook = async (req, res) => {
  try {
    const { gateway } = req.params;
    const signature = req.headers['stripe-signature'] || req.headers['x-razorpay-signature'] || req.headers['x-cashfree-signature'];
    const payload = JSON.stringify(req.body);

    const paymentService = new PaymentGatewayService(gateway);
    const verification = await paymentService.verifyWebhook(signature, payload);

    if (!verification.success) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = verification.event;

    // Handle different event types based on gateway
    switch (gateway) {
      case 'stripe':
        await handleStripeWebhook(event);
        break;
      case 'razorpay':
        await handleRazorpayWebhook(event);
        break;
      case 'cashfree':
        await handleCashfreeWebhook(event);
        break;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

// @desc    Get payment methods for school
// @route   GET /api/v1/payment/methods
// @access  School Admin
exports.getPaymentMethods = async (req, res) => {
  try {
    const school = await School.findById(req.school._id);
    
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    if (!school.stripeCustomerId) {
      return res.json({ success: true, paymentMethods: [] });
    }

    const paymentService = new PaymentGatewayService('stripe');
    const { paymentMethods } = await paymentService.getPaymentMethods(school.stripeCustomerId);

    res.json({
      success: true,
      paymentMethods,
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment methods' });
  }
};

// @desc    Create refund
// @route   POST /api/v1/payment/refund
// @access  School Admin
exports.createRefund = async (req, res) => {
  try {
    const { paymentId, amount, reason, gateway = 'stripe' } = req.body;

    const paymentService = new PaymentGatewayService(gateway);
    const { refund } = await paymentService.createRefund({ paymentId, amount, reason });

    res.json({
      success: true,
      refund,
    });
  } catch (error) {
    console.error('Create refund error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper functions for webhook handling
async function handleStripeWebhook(event) {
  const School = require('../models/Plan');
  
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const { schoolId, planId, billingCycle } = session.metadata;
      
      // Update school subscription
      const school = await School.findById(schoolId);
      if (school) {
        const plan = await Plan.findById(planId);
        if (plan) {
          school.subscription = {
            plan: plan.name,
            status: 'active',
            billingCycle,
            price: billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice,
            renewalDate: new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
            changedAt: new Date(),
          };
          await school.save();
        }
      }
      break;
      
    case 'payment_intent.payment_failed':
      // Handle payment failure
      break;
      
    case 'customer.subscription.deleted':
      // Handle subscription cancellation
      break;
  }
}

async function handleRazorpayWebhook(event) {
  // Handle Razorpay webhook events
  switch (event.event) {
    case 'order.paid':
      // Update school subscription
      break;
      
    case 'payment.failed':
      // Handle payment failure
      break;
  }
}

async function handleCashfreeWebhook(event) {
  // Handle Cashfree webhook events
  switch (event.type) {
    case 'PAYMENT_SUCCESS':
      // Update school subscription
      break;
      
    case 'PAYMENT_FAILED':
      // Handle payment failure
      break;
  }
}
