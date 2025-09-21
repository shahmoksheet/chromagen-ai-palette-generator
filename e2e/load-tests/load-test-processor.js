module.exports = {
  $randomPrompt: function() {
    const prompts = [
      "vibrant sunset colors for a beach resort",
      "professional corporate color scheme",
      "warm autumn palette for cozy cafe",
      "modern tech startup brand colors",
      "nature-inspired green color palette",
      "elegant wedding color scheme",
      "energetic fitness brand colors",
      "calming spa and wellness colors",
      "bold fashion brand palette",
      "minimalist design color scheme",
      "retro 80s inspired colors",
      "luxury brand color palette",
      "children's toy brand colors",
      "medical healthcare color scheme",
      "food and restaurant brand colors"
    ];
    
    return prompts[Math.floor(Math.random() * prompts.length)];
  },
  
  beforeRequest: function(requestParams, context, ee, next) {
    // Add request timing
    context.vars.requestStart = Date.now();
    return next();
  },
  
  afterResponse: function(requestParams, response, context, ee, next) {
    // Calculate response time
    const responseTime = Date.now() - context.vars.requestStart;
    
    // Log slow responses
    if (responseTime > 5000) {
      console.log(`Slow response: ${requestParams.url} took ${responseTime}ms`);
    }
    
    // Track error rates
    if (response.statusCode >= 400) {
      console.log(`Error response: ${response.statusCode} for ${requestParams.url}`);
    }
    
    return next();
  }
};