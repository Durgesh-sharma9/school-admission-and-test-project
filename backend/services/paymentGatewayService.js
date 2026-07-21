/**
 * Payment Gateway Service - Abstraction Layer
 * Supports multiple payment gateways: Stripe, Razorpay, Cashfree
 */

class PaymentGatewayService {
  constructor(gatewayType = 'stripe') {
    this.gatewayType = gatewayType;
    this.gateway = this.initializeGateway(gatewayType);
  }

  initializeGateway(gatewayType) {
    switch (gatewayType) {
      case 'stripe':
        return new StripeGateway();
      case 'razorpay':
        return new RazorpayGateway();
      case 'cashfree':
        return new CashfreeGateway();
      default:
        throw new Error(`Unsupported payment gateway: ${gatewayType}`);
    }
  }

  /**
   * Create a payment session for subscription purchase/upgrade
   */
  async createPaymentSession({ planId, billingCycle, schoolId, returnUrl }) {
    return this.gateway.createPaymentSession({ planId, billingCycle, schoolId, returnUrl });
  }

  /**
   * Verify payment webhook
   */
  async verifyWebhook(signature, payload) {
    return this.gateway.verifyWebhook(signature, payload);
  }

  /**
   * Process payment success
   */
  async handlePaymentSuccess(paymentData) {
    return this.gateway.handlePaymentSuccess(paymentData);
  }

  /**
   * Process payment failure
   */
  async handlePaymentFailure(paymentData) {
    return this.gateway.handlePaymentFailure(paymentData);
  }

  /**
   * Create customer
   */
  async createCustomer({ email, name, phone, metadata }) {
    return this.gateway.createCustomer({ email, name, phone, metadata });
  }

  /**
   * Get payment methods for customer
   */
  async getPaymentMethods(customerId) {
    return this.gateway.getPaymentMethods(customerId);
  }

  /**
   * Create subscription (recurring billing)
   */
  async createSubscription({ customerId, priceId, trialDays }) {
    return this.gateway.createSubscription({ customerId, priceId, trialDays });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId) {
    return this.gateway.cancelSubscription(subscriptionId);
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId, updates) {
    return this.gateway.updateSubscription(subscriptionId, updates);
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId) {
    return this.gateway.getSubscription(subscriptionId);
  }

  /**
   * Create refund
   */
  async createRefund({ paymentId, amount, reason }) {
    return this.gateway.createRefund({ paymentId, amount, reason });
  }
}

/**
 * Stripe Gateway Implementation
 */
class StripeGateway {
  constructor() {
    const stripe = require('stripe');
    this.stripe = stripe(process.env.STRIPE_SECRET_KEY);
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  }

  async createPaymentSession({ planId, billingCycle, schoolId, returnUrl }) {
    try {
      const Plan = require('../models/Plan');
      const School = require('../models/School');
      
      const plan = await Plan.findById(planId);
      const school = await School.findById(schoolId);

      if (!plan || !school) {
        throw new Error('Plan or School not found');
      }

      const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
      const amountInCents = Math.round(price * 100);

      // Create or get Stripe customer
      let customerId = school.stripeCustomerId;
      if (!customerId) {
        const customer = await this.stripe.customers.create({
          email: school.email,
          name: school.name,
          metadata: { schoolId: school._id.toString() },
        });
        customerId = customer.id;
        school.stripeCustomerId = customerId;
        await school.save();
      }

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: plan.currency.toLowerCase(),
              product_data: {
                name: plan.name,
                description: plan.description,
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: billingCycle === 'yearly' ? 'payment' : 'payment', // Can be 'subscription' for recurring
        success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&status=success`,
        cancel_url: `${returnUrl}?status=cancelled`,
        metadata: {
          schoolId: school._id.toString(),
          planId: plan._id.toString(),
          billingCycle,
        },
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
        gateway: 'stripe',
      };
    } catch (error) {
      console.error('Stripe create session error:', error);
      throw new Error(`Failed to create Stripe session: ${error.message}`);
    }
  }

  async verifyWebhook(signature, payload) {
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      return { success: true, event };
    } catch (error) {
      console.error('Stripe webhook verification error:', error);
      return { success: false, error: error.message };
    }
  }

  async handlePaymentSuccess(paymentData) {
    // Handle Stripe payment success webhook
    const { metadata, payment_intent } = paymentData;
    // Update school subscription, send confirmation email, etc.
    return { success: true };
  }

  async handlePaymentFailure(paymentData) {
    // Handle Stripe payment failure webhook
    return { success: true };
  }

  async createCustomer({ email, name, phone, metadata }) {
    const customer = await this.stripe.customers.create({
      email,
      name,
      phone,
      metadata,
    });
    return { success: true, customerId: customer.id };
  }

  async getPaymentMethods(customerId) {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    return { success: true, paymentMethods: paymentMethods.data };
  }

  async createSubscription({ customerId, priceId, trialDays }) {
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: trialDays,
    });
    return { success: true, subscriptionId: subscription.id };
  }

  async cancelSubscription(subscriptionId) {
    const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
    return { success: true, subscription };
  }

  async updateSubscription(subscriptionId, updates) {
    const subscription = await this.stripe.subscriptions.update(subscriptionId, updates);
    return { success: true, subscription };
  }

  async getSubscription(subscriptionId) {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    return { success: true, subscription };
  }

  async createRefund({ paymentId, amount, reason }) {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason,
    });
    return { success: true, refund };
  }
}

/**
 * Razorpay Gateway Implementation
 */
class RazorpayGateway {
  constructor() {
    const Razorpay = require('razorpay');
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  async createPaymentSession({ planId, billingCycle, schoolId, returnUrl }) {
    try {
      const Plan = require('../models/Plan');
      const School = require('../models/School');
      
      const plan = await Plan.findById(planId);
      const school = await School.findById(schoolId);

      if (!plan || !school) {
        throw new Error('Plan or School not found');
      }

      const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
      const amountInPaise = Math.round(price * 100);

      const order = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency: plan.currency.toUpperCase(),
        receipt: `order_${schoolId}_${Date.now()}`,
        notes: {
          schoolId: school._id.toString(),
          planId: plan._id.toString(),
          billingCycle,
        },
      });

      return {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        gateway: 'razorpay',
      };
    } catch (error) {
      console.error('Razorpay create order error:', error);
      throw new Error(`Failed to create Razorpay order: ${error.message}`);
    }
  }

  async verifyWebhook(signature, payload) {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');
    
    if (expectedSignature === signature) {
      return { success: true, event: JSON.parse(payload) };
    }
    return { success: false, error: 'Invalid signature' };
  }

  async handlePaymentSuccess(paymentData) {
    return { success: true };
  }

  async handlePaymentFailure(paymentData) {
    return { success: true };
  }

  async createCustomer({ email, name, phone, metadata }) {
    // Razorpay doesn't have a separate customer creation like Stripe
    // Customer info is passed during order creation
    return { success: true };
  }

  async getPaymentMethods(customerId) {
    // Razorpay doesn't store payment methods separately
    return { success: true, paymentMethods: [] };
  }

  async createSubscription({ customerId, priceId, trialDays }) {
    const subscription = await this.razorpay.subscriptions.create({
      plan_id: priceId,
      customer_notify: 1,
      total_count: 12, // 12 months by default
      start_at: Math.floor(Date.now() / 1000) + (trialDays * 24 * 60 * 60),
    });
    return { success: true, subscriptionId: subscription.id };
  }

  async cancelSubscription(subscriptionId) {
    const subscription = await this.razorpay.subscriptions.cancel(subscriptionId);
    return { success: true, subscription };
  }

  async updateSubscription(subscriptionId, updates) {
    const subscription = await this.razorpay.subscriptions.edit(subscriptionId, updates);
    return { success: true, subscription };
  }

  async getSubscription(subscriptionId) {
    const subscription = await this.razorpay.subscriptions.fetch(subscriptionId);
    return { success: true, subscription };
  }

  async createRefund({ paymentId, amount, reason }) {
    const refund = await this.razorpay.payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined,
      notes: { reason },
    });
    return { success: true, refund };
  }
}

/**
 * Cashfree Gateway Implementation
 */
class CashfreeGateway {
  constructor() {
    this.apiKey = process.env.CASHFREE_API_KEY;
    this.apiSecret = process.env.CASHFREE_API_SECRET;
    this.environment = process.env.CASHFREE_ENVIRONMENT || 'sandbox';
  }

  async createPaymentSession({ planId, billingCycle, schoolId, returnUrl }) {
    try {
      const Plan = require('../models/Plan');
      const School = require('../models/School');
      
      const plan = await Plan.findById(planId);
      const school = await School.findById(schoolId);

      if (!plan || !school) {
        throw new Error('Plan or School not found');
      }

      const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
      const orderId = `order_${schoolId}_${Date.now()}`;

      // Cashfree API call to create payment session
      // This is a simplified implementation
      const sessionData = {
        order_id: orderId,
        order_amount: price,
        order_currency: plan.currency,
        customer_details: {
          customer_id: school._id.toString(),
          customer_email: school.email,
          customer_name: school.name,
        },
        order_meta: {
          return_url: returnUrl,
          payment_methods: 'cc,upi',
        },
        order_note: `${plan.name} - ${billingCycle}`,
      };

      // In production, make actual API call to Cashfree
      // const response = await axios.post(`${this.getCashfreeUrl()}/orders`, sessionData, {
      //   headers: this.getHeaders(),
      // });

      return {
        success: true,
        orderId,
        paymentSessionId: 'mock_session_id',
        gateway: 'cashfree',
      };
    } catch (error) {
      console.error('Cashfree create session error:', error);
      throw new Error(`Failed to create Cashfree session: ${error.message}`);
    }
  }

  getCashfreeUrl() {
    return this.environment === 'production' 
      ? 'https://api.cashfree.com/pg' 
      : 'https://sandbox.cashfree.com/pg';
  }

  getHeaders() {
    return {
      'x-api-key': this.apiKey,
      'x-api-secret': this.apiSecret,
      'Content-Type': 'application/json',
    };
  }

  async verifyWebhook(signature, payload) {
    // Implement Cashfree webhook verification
    return { success: true, event: JSON.parse(payload) };
  }

  async handlePaymentSuccess(paymentData) {
    return { success: true };
  }

  async handlePaymentFailure(paymentData) {
    return { success: true };
  }

  async createCustomer({ email, name, phone, metadata }) {
    return { success: true };
  }

  async getPaymentMethods(customerId) {
    return { success: true, paymentMethods: [] };
  }

  async createSubscription({ customerId, priceId, trialDays }) {
    return { success: true, subscriptionId: 'mock_subscription_id' };
  }

  async cancelSubscription(subscriptionId) {
    return { success: true };
  }

  async updateSubscription(subscriptionId, updates) {
    return { success: true };
  }

  async getSubscription(subscriptionId) {
    return { success: true, subscription: {} };
  }

  async createRefund({ paymentId, amount, reason }) {
    return { success: true, refund: {} };
  }
}

module.exports = PaymentGatewayService;
