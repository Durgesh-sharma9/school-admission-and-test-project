import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, GraduationCap, Check, ArrowRight, Star, Mail, Phone, MapPin, ChevronDown } from 'lucide-react';
import Button from '../../../shared/components/Button';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmsContent, setCmsContent] = useState({});

  useEffect(() => {
    // Mock CMS content - will be fetched from backend
    setCmsContent({
      hero: {
        title: 'Streamline Your School Admissions',
        subtitle: 'A modern CRM platform to manage inquiries, assessments, and admissions seamlessly',
        ctaText: 'Start Free Trial',
        secondaryCtaText: 'Book a Demo',
      },
      features: {
        title: 'Everything You Need',
        subtitle: 'Powerful features to transform your admission process',
        items: [
          { title: 'Digital Forms', description: 'Create custom admission forms with ease' },
          { title: 'Online Assessments', description: 'Conduct assessments remotely' },
          { title: 'QR Code Integration', description: 'Quick access for parents' },
          { title: 'Analytics Dashboard', description: 'Track all your metrics' },
        ],
      },
      howItWorks: {
        title: 'How It Works',
        steps: [
          { step: 1, title: 'Sign Up', description: 'Create your school account in minutes' },
          { step: 2, title: 'Configure', description: 'Set up your admission form and branding' },
          { step: 3, title: 'Share', description: 'Share QR code with parents' },
          { step: 4, title: 'Manage', description: 'Track and manage all applications' },
        ],
      },
      pricing: {
        title: 'Simple Pricing',
        subtitle: 'Choose the plan that fits your needs',
        plans: [
          { name: 'Starter', price: 29, period: 'month', features: ['100 students', 'Basic features', 'Email support'] },
          { name: 'Professional', price: 79, period: 'month', features: ['500 students', 'Advanced features', 'Priority support', 'Custom branding'] },
          { name: 'Enterprise', price: 199, period: 'month', features: ['Unlimited students', 'All features', '24/7 support', 'Dedicated account manager'] },
        ],
      },
      faq: {
        title: 'Frequently Asked Questions',
        items: [
          { question: 'How long is the free trial?', answer: 'We offer a 7-day free trial with full access to all features.' },
          { question: 'Can I change my plan later?', answer: 'Yes, you can upgrade or downgrade your plan at any time.' },
          { question: 'Is my data secure?', answer: 'Yes, we use industry-standard encryption to protect your data.' },
          { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, UPI, and bank transfers.' },
        ],
      },
      testimonials: {
        title: 'What Schools Say',
        items: [
          { name: 'John Smith', role: 'Principal, Springfield High', quote: 'This platform transformed our admission process completely. We saved 60% of our time.' },
          { name: 'Sarah Johnson', role: 'Admin, Lincoln Academy', quote: 'Easy to use and very powerful. Highly recommended for any school!' },
          { name: 'Mike Davis', role: 'Director, Washington Prep', quote: 'The QR code feature is a game-changer. Parents love it!' },
        ],
      },
      contact: {
        title: 'Get In Touch',
        email: 'support@schoolcrm.com',
        phone: '+1 234 567 890',
        address: '123 Education Street, Learning City',
      },
      footer: {
        copyright: '© 2026 School Admission CRM. All rights reserved.',
        links: [
          { text: 'Privacy Policy', url: '/privacy' },
          { text: 'Terms of Service', url: '/terms' },
          { text: 'Contact', url: '/contact' },
        ],
      },
    });
  }, []);

  const { hero, features, howItWorks, pricing, faq, testimonials, contact, footer } = cmsContent;

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">School Admission CRM</span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How It Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
              <a href="#faq" className="text-gray-600 hover:text-gray-900">FAQ</a>
              <Link to="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
              <Link to="/signup">
                <Button className="bg-indigo-600 hover:bg-indigo-700">Start Free Trial</Button>
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
            <a href="#features" className="block text-gray-600 hover:text-gray-900">Features</a>
            <a href="#how-it-works" className="block text-gray-600 hover:text-gray-900">How It Works</a>
            <a href="#pricing" className="block text-gray-600 hover:text-gray-900">Pricing</a>
            <a href="#faq" className="block text-gray-600 hover:text-gray-900">FAQ</a>
            <Link to="/login" className="block text-gray-600 hover:text-gray-900">Login</Link>
            <Link to="/signup">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Start Free Trial</Button>
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            {hero?.title || 'Streamline Your School Admissions'}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {hero?.subtitle || 'A modern CRM platform to manage inquiries, assessments, and admissions seamlessly'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-4 flex items-center justify-center gap-2">
                {hero?.ctaText || 'Start Free Trial'}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" className="text-lg px-8 py-4 border-2 border-gray-300">
              {hero?.secondaryCtaText || 'Book a Demo'}
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{features?.title || 'Everything You Need'}</h2>
            <p className="text-xl text-gray-600">{features?.subtitle || 'Powerful features to transform your admission process'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features?.items?.map((feature, idx) => (
              <div key={idx} className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Check className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{howItWorks?.title || 'How It Works'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks?.steps?.map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{pricing?.title || 'Simple Pricing'}</h2>
            <p className="text-xl text-gray-600">{pricing?.subtitle || 'Choose the plan that fits your needs'}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricing?.plans?.map((plan, idx) => (
              <div key={idx} className={`p-8 rounded-xl border-2 ${idx === 1 ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2 text-gray-600">
                      <Check className="w-5 h-5 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button className={`w-full ${idx === 1 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-900 hover:bg-gray-800'}`}>
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{faq?.title || 'Frequently Asked Questions'}</h2>
          </div>
          <div className="space-y-4">
            {faq?.items?.map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-2">{item.question}</h3>
                <p className="text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{testimonials?.title || 'What Schools Say'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials?.items?.map((item, idx) => (
              <div key={idx} className="p-6 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{item.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{contact?.title || 'Get In Touch'}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Email</p>
                <p className="text-gray-600">{contact?.email || 'support@schoolcrm.com'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Phone</p>
                <p className="text-gray-600">{contact?.phone || '+1 234 567 890'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Address</p>
                <p className="text-gray-600">{contact?.address || '123 Education Street, Learning City'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">School Admission CRM</span>
            </div>
            <div className="flex gap-6">
              {footer?.links?.map((link, idx) => (
                <a key={idx} href={link.url} className="text-gray-400 hover:text-white">
                  {link.text}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>{footer?.copyright || '© 2026 School Admission CRM. All rights reserved.'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
