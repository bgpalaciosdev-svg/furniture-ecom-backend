import { IDeliveryService } from '../types/delivery.types';
import { mockDeliveryService } from './delivery.service.mock';

// Environment flag to switch between mock and real service
const USE_MOCK_DELIVERY = process.env.NEXT_PUBLIC_USE_MOCK_DELIVERY === 'true';

// Main delivery service that switches between mock and real implementation
class DeliveryService implements IDeliveryService {
  private service: IDeliveryService;

  constructor() {
    if (USE_MOCK_DELIVERY || process.env.NODE_ENV === 'development') {
      console.log('[DeliveryService] Using mock delivery service');
      this.service = mockDeliveryService;
    } else {
      console.log('[DeliveryService] Using real delivery service');
      // TODO: Import and use real service when backend is ready
      // this.service = realDeliveryService;
      
      // For now, fallback to mock in production until real service is implemented
      console.warn('[DeliveryService] Real service not implemented yet, falling back to mock');
      this.service = mockDeliveryService;
    }
  }

  async validateAddress(request: Parameters<IDeliveryService['validateAddress']>[0]) {
    return this.service.validateAddress(request);
  }

  async calculateDeliveryCost(request: Parameters<IDeliveryService['calculateDeliveryCost']>[0]) {
    return this.service.calculateDeliveryCost(request);
  }
}

// Export singleton instance
export default new DeliveryService();

// Export types and utilities for components
export * from '../types/delivery.types';
export { handleDeliveryError, MOCK_TEST_DATA } from './delivery.service.mock';
