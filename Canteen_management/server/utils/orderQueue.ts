interface QueueItem {
  id: string;
  orderData: any;
  userId: string;
  timestamp: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class OrderQueue {
  private static instance: OrderQueue;
  private queue: QueueItem[] = [];
  private processing = false;
  private maxConcurrency = 5; // Process 5 orders simultaneously
  private activeJobs = 0;

  private constructor() {}

  static getInstance(): OrderQueue {
    if (!OrderQueue.instance) {
      OrderQueue.instance = new OrderQueue();
    }
    return OrderQueue.instance;
  }

  async addOrder(orderData: any, userId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const queueItem: QueueItem = {
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderData,
        userId,
        timestamp: Date.now(),
        resolve,
        reject,
      };

      this.queue.push(queueItem);
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.activeJobs >= this.maxConcurrency) {
      return;
    }

    const item = this.queue.shift();
    if (!item) {
      return;
    }

    this.processing = true;
    this.activeJobs++;

    try {
      // Process the order (implement your order processing logic here)
      const result = await this.processOrder(item);
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.activeJobs--;
      this.processing = false;

      // Continue processing if there are more items and capacity
      if (this.queue.length > 0 && this.activeJobs < this.maxConcurrency) {
        setImmediate(() => this.processQueue());
      }
    }
  }

  private async processOrder(item: QueueItem): Promise<any> {
    // This would contain your actual order processing logic
    // For now, it's a placeholder that simulates processing time
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      orderId: item.id,
      status: "processed",
      timestamp: Date.now(),
      ...item.orderData,
    };
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      activeJobs: this.activeJobs,
      maxConcurrency: this.maxConcurrency,
    };
  }
}

export default OrderQueue.getInstance();
