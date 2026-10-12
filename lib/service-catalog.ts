export type Service = {
  id: string;
  name: string;
  description: string;
  startingPrice: number;
  billing: "project" | "month";
  features: readonly string[];
  highlight?: boolean;
};

export const serviceCatalog: readonly Service[] = [
  {
    id: "wordpress",
    name: "WordPress Websites",
    description: "Custom WordPress websites with thoughtful design, straightforward content management, and a strong foundation for search.",
    startingPrice: 1500,
    billing: "project",
    features: ["Custom responsive design", "Content management setup", "Technical SEO foundations", "Launch and handover"],
  },
  {
    id: "custom-development",
    name: "Custom Web Development",
    description: "Websites and applications built around your business, from customer portals to custom APIs and complex workflows.",
    startingPrice: 4500,
    billing: "project",
    features: ["Custom frontend and backend", "CMS or admin dashboard", "API and database integration", "Performance and accessibility"],
    highlight: true,
  },
  {
    id: "shopify",
    name: "Shopify Commerce",
    description: "Shopify stores that bring your brand to life, with custom storefront development and integrations tailored to how you sell.",
    startingPrice: 3500,
    billing: "project",
    features: ["Store and theme setup", "Custom Liquid development", "Product and collection setup", "Commerce integrations"],
  },
  {
    id: "payments",
    name: "Payments & Integrations",
    description: "Payment gateways, subscriptions, and custom integrations that connect your website to the systems your team relies on.",
    startingPrice: 2500,
    billing: "project",
    features: ["Payment gateway integration", "Subscription billing workflows", "Webhooks and custom APIs", "Testing and implementation notes"],
  },
  {
    id: "seo-marketing",
    name: "SEO & Digital Marketing",
    description: "Ongoing search and marketing work with clear priorities, useful content, campaign management, and reporting you can act on.",
    startingPrice: 2000,
    billing: "month",
    features: ["Technical SEO and content strategy", "Campaign setup and management", "Conversion and analytics review", "Monthly progress reporting"],
  },
  {
    id: "business-erp",
    name: "Business Management & ERP",
    description: "Custom management systems for inventory, sales, operations, and reporting, designed around your team's day-to-day work.",
    startingPrice: 12500,
    billing: "project",
    features: ["Workflow and requirements mapping", "Inventory and sales modules", "Roles, permissions, and reporting", "System integration and handover"],
  },
  {
    id: "ai-ml",
    name: "AI Research & ML Models",
    description: "Applied AI research and machine learning development using your datasets, with a defined problem, measured evaluation, and practical delivery.",
    startingPrice: 10000,
    billing: "project",
    features: ["Research and feasibility assessment", "Dataset preparation and analysis", "Model training and evaluation", "Deployment plan and documentation"],
  },
  {
    id: "cloud-agents",
    name: "Cloud & AI Agent Deployment",
    description: "Cloud infrastructure and agent deployments on AWS or your existing platform, including Hermes, OpenClaw, and custom runtimes.",
    startingPrice: 3500,
    billing: "project",
    features: ["Cloud and runtime configuration", "Agent and tool integrations", "Access controls and monitoring", "Deployment and operations handover"],
  },
];

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatServicePrice(price: number) {
  return usd.format(price);
}

export function serviceBillingLabel(billing: Service["billing"]) {
  return billing === "month" ? "per month" : "per project";
}
