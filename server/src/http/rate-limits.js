const { rateLimit, MemoryStore } = require('express-rate-limit');

function createRatePolicies(config) {
  const stores = [];
  function policy(limit) {
    const store = new MemoryStore(); stores.push(store);
    return rateLimit({ windowMs: config.rateWindowMs, limit, store,
      standardHeaders: 'draft-7', legacyHeaders: false,
      // Forwarded headers are ignored unless the explicit proxy trust policy allows them.
      validate: { xForwardedForHeader: false, forwardedHeader: false },
    });
  }
  return { global: policy(config.rateGlobal), create: policy(config.rateCreate),
    read: policy(config.rateRead), mutation: policy(config.rateMutation),
    dispose() { for (const store of stores) store.shutdown(); } };
}
module.exports = { createRatePolicies };
