export const subscriptionTiers = [
  {
    id: "starter",
    name: "Starter",
    price: 299,
    currency: "CNY",
    cadence: "month",
    quota: {
      aiSessions: 50,
      attorneyHours: 0
    },
    features: [
      "50 AI conversations per month",
      "Core contract template library",
      "Email verification + 2FA",
      "eSignature integration"
    ],
    addOns: ["GDPR baseline audit", "Template localisation pack"]
  },
  {
    id: "growth",
    name: "Growth",
    price: 699,
    currency: "CNY",
    cadence: "month",
    quota: {
      aiSessions: "Unlimited",
      attorneyHours: 4
    },
    features: [
      "Unlimited AI conversations",
      "Persistent workspace with context memory",
      "Specialised regulatory playbooks",
      "4 attorney hours included monthly"
    ],
    addOns: ["Cross-border data transfer wizard", "Regulation change alerts"]
  },
  {
    id: "elite",
    name: "Elite",
    price: 1499,
    currency: "CNY",
    cadence: "month",
    quota: {
      aiSessions: "Unlimited",
      attorneyHours: 12
    },
    features: [
      "Dedicated compliance strategist",
      "Priority attorney escalation",
      "Custom AI blueprints & API access",
      "Quarterly compliance audits & training"
    ],
    addOns: ["In-house counsel enablement", "Industry-specific risk monitors"]
  }
];
