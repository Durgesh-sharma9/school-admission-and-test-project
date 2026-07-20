import React, { useState, useEffect } from 'react';
import { FileText, Eye, Save, Edit } from 'lucide-react';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Modal from '../../../shared/components/Modal';

const LandingCMS = () => {
  const [activeSection, setActiveSection] = useState('hero');
  const [cmsContent, setCmsContent] = useState({});
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const sections = [
    { id: 'hero', name: 'Hero Section', icon: FileText },
    { id: 'features', name: 'Features', icon: FileText },
    { id: 'howItWorks', name: 'How It Works', icon: FileText },
    { id: 'pricing', name: 'Pricing', icon: FileText },
    { id: 'faq', name: 'FAQ', icon: FileText },
    { id: 'testimonials', name: 'Testimonials', icon: FileText },
    { id: 'contact', name: 'Contact', icon: FileText },
    { id: 'footer', name: 'Footer', icon: FileText },
  ];

  const defaultContent = {
    hero: {
      title: 'Streamline Your School Admissions',
      subtitle: 'A modern CRM platform to manage inquiries, assessments, and admissions seamlessly',
      ctaText: 'Start Free Trial',
      secondaryCtaText: 'Book a Demo',
      backgroundImage: '',
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
        { name: 'Starter', price: '$29/month', features: ['100 students', 'Basic features', 'Email support'] },
        { name: 'Professional', price: '$79/month', features: ['500 students', 'Advanced features', 'Priority support'] },
        { name: 'Enterprise', price: '$199/month', features: ['Unlimited students', 'All features', '24/7 support'] },
      ],
    },
    faq: {
      title: 'Frequently Asked Questions',
      items: [
        { question: 'How long is the free trial?', answer: 'We offer a 7-day free trial with full access to all features.' },
        { question: 'Can I change my plan later?', answer: 'Yes, you can upgrade or downgrade your plan at any time.' },
        { question: 'Is my data secure?', answer: 'Yes, we use industry-standard encryption to protect your data.' },
      ],
    },
    testimonials: {
      title: 'What Schools Say',
      items: [
        { name: 'John Smith', role: 'Principal, Springfield High', quote: 'This platform transformed our admission process completely.' },
        { name: 'Sarah Johnson', role: 'Admin, Lincoln Academy', quote: 'Easy to use and very powerful. Highly recommended!' },
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
  };

  useEffect(() => {
    fetchCMSContent();
  }, [activeSection]);

  const fetchCMSContent = async () => {
    setLoading(true);
    try {
      // Mock data for now - will be replaced with actual API call
      setCmsContent(defaultContent[activeSection] || {});
    } catch (error) {
      console.error('Failed to fetch CMS content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      // await superAdminApi.put(`/cms/${activeSection}`, cmsContent);
      alert('Content saved successfully!');
    } catch (error) {
      console.error('Failed to save CMS content:', error);
      alert('Failed to save content');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleContentChange = (field, value) => {
    setCmsContent(prev => ({ ...prev, [field]: value }));
  };

  const renderEditor = () => {
    switch (activeSection) {
      case 'hero':
        return (
          <div className="space-y-4">
            <Input
              label="Title"
              value={cmsContent.title || ''}
              onChange={(e) => handleContentChange('title', e.target.value)}
            />
            <Input
              label="Subtitle"
              value={cmsContent.subtitle || ''}
              onChange={(e) => handleContentChange('subtitle', e.target.value)}
            />
            <Input
              label="CTA Button Text"
              value={cmsContent.ctaText || ''}
              onChange={(e) => handleContentChange('ctaText', e.target.value)}
            />
            <Input
              label="Secondary CTA Text"
              value={cmsContent.secondaryCtaText || ''}
              onChange={(e) => handleContentChange('secondaryCtaText', e.target.value)}
            />
          </div>
        );
      case 'features':
        return (
          <div className="space-y-4">
            <Input
              label="Title"
              value={cmsContent.title || ''}
              onChange={(e) => handleContentChange('title', e.target.value)}
            />
            <Input
              label="Subtitle"
              value={cmsContent.subtitle || ''}
              onChange={(e) => handleContentChange('subtitle', e.target.value)}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase mb-2">
                Features
              </label>
              {cmsContent.items?.map((item, idx) => (
                <div key={idx} className="mb-2 p-3 bg-slate-700 rounded-lg">
                  <Input
                    label={`Feature ${idx + 1} Title`}
                    value={item.title}
                    onChange={(e) => {
                      const newItems = [...cmsContent.items];
                      newItems[idx].title = e.target.value;
                      handleContentChange('items', newItems);
                    }}
                  />
                  <Input
                    label={`Feature ${idx + 1} Description`}
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...cmsContent.items];
                      newItems[idx].description = e.target.value;
                      handleContentChange('items', newItems);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <Input
              label="Title"
              value={cmsContent.title || ''}
              onChange={(e) => handleContentChange('title', e.target.value)}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-300 tracking-wide uppercase mb-2">
                Content (JSON)
              </label>
              <textarea
                value={JSON.stringify(cmsContent, null, 2)}
                onChange={(e) => {
                  try {
                    handleContentChange('content', JSON.parse(e.target.value));
                  } catch (err) {
                    // Invalid JSON, don't update
                  }
                }}
                rows={10}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        );
    }
  };

  const renderPreview = () => {
    switch (activeSection) {
      case 'hero':
        return (
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-8 text-white">
            <h1 className="text-4xl font-bold mb-4">{cmsContent.title}</h1>
            <p className="text-xl mb-6 opacity-90">{cmsContent.subtitle}</p>
            <div className="flex gap-4">
              <button className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold">
                {cmsContent.ctaText}
              </button>
              <button className="px-6 py-3 border-2 border-white rounded-lg font-semibold">
                {cmsContent.secondaryCtaText}
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="bg-slate-700 rounded-xl p-8">
            <pre className="text-white text-sm">{JSON.stringify(cmsContent, null, 2)}</pre>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Landing CMS</h1>
          <p className="text-slate-400">Manage landing page content</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button
            onClick={handleSave}
            isLoading={saveLoading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Sections</h3>
            <div className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{section.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">
                {sections.find(s => s.id === activeSection)?.name}
              </h2>
              <Edit className="w-5 h-5 text-slate-400" />
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : previewMode ? (
              renderPreview()
            ) : (
              renderEditor()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingCMS;
