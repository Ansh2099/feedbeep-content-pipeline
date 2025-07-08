class RateLimiter {
  constructor(maxRequests = 10, timeWindow = 60000) { // 10 requests per minute by default
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }

  /**
   * Check if a request can be made
   */
  canMakeRequest() {
    const now = Date.now();
    
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    return this.requests.length < this.maxRequests;
  }

  /**
   * Record a request
   */
  recordRequest() {
    this.requests.push(Date.now());
  }

  /**
   * Wait until a request can be made
   */
  async waitForSlot() {
    while (!this.canMakeRequest()) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (Date.now() - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime + 100)); // Add 100ms buffer
      }
    }
  }

  /**
   * Get current request count
   */
  getCurrentCount() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return this.requests.length;
  }

  /**
   * Get time until next available slot
   */
  getTimeUntilNextSlot() {
    if (this.canMakeRequest()) {
      return 0;
    }
    
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length === 0) {
      return 0;
    }
    
    const oldestRequest = Math.min(...this.requests);
    return this.timeWindow - (now - oldestRequest);
  }
}

module.exports = RateLimiter; 