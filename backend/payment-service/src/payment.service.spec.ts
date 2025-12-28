import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { getModelToken } from '@nestjs/mongoose';
import { Payment } from './schemas/payment.schema';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PaymentService', () => {
    let service: PaymentService;
    let mockPaymentModel: any;

    beforeEach(async () => {
        // Mock the instance of the model (document)
        const mockPaymentInstance = {
            save: jest.fn(),
            _id: 'mock_id',
            amount: 100,
            status: 'completed',
            paymentMethod: 'credit_card',
            orderId: 'order_123',
            stripePaymentIntentId: 'pi_mock_123'
        };

        // Mock the model class itself
        mockPaymentModel = jest.fn().mockImplementation((dto) => ({
            ...dto,
            ...mockPaymentInstance,
            save: jest.fn().mockResolvedValue({ ...dto, ...mockPaymentInstance }),
        }));

        // Add static methods to the mock model
        (mockPaymentModel as any).findOne = jest.fn();
        (mockPaymentModel as any).findById = jest.fn();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentService,
                {
                    provide: getModelToken(Payment.name),
                    useValue: mockPaymentModel,
                },
            ],
        }).compile();

        service = module.get<PaymentService>(PaymentService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('processPayment', () => {
        it('should throw error for invalid payment method', async () => {
            await expect(service.processPayment({ paymentMethod: 'invalid' }))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw error for missing paypal email', async () => {
            await expect(service.processPayment({ paymentMethod: 'paypal' }))
                .rejects.toThrow(BadRequestException);
        });

        it('should validate credit card details', async () => {
            await expect(service.processPayment({ paymentMethod: 'credit_card', cardDetails: {} }))
                .rejects.toThrow(BadRequestException);
        });

        it('should process valid credit card payment', async () => {
            // Mock random to ensure success
            jest.spyOn(Math, 'random').mockReturnValue(0.9);

            const result = await service.processPayment({
                orderId: '123',
                amount: 100,
                paymentMethod: 'credit_card',
                cardDetails: { number: '1234567812345678', cvc: '123' }
            });

            expect(result.success).toBe(true);
            expect(result.data.status).toBe('completed');
        });

        it('should handle payment failure', async () => {
            // Mock random to ensure failure (value < 0.1)
            jest.spyOn(Math, 'random').mockReturnValue(0.05);

            const result = await service.processPayment({
                orderId: '123',
                amount: 100,
                paymentMethod: 'credit_card',
                cardDetails: { number: '1234567812345678', cvc: '123' }
            });

            expect(result.success).toBe(false);
            expect(result.data.status).toBe('failed');
            expect(result.data.failureReason).toBeDefined();
        });
    });

    describe('refundPayment', () => {
        it('should refund a completed payment', async () => {
            const mockPayment = {
                _id: 'pid',
                status: 'completed',
                amount: 100,
                save: jest.fn(),
            } as any;
            (mockPaymentModel.findById as jest.Mock).mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockPayment)
            });

            // Mock random for failure check (return > 0.05 for success)
            jest.spyOn(Math, 'random').mockReturnValue(0.5);

            const result = await service.refundPayment('pid', 50);
            expect(result.success).toBe(true);
            expect(mockPayment.status).toBe('refunded');
            expect(mockPayment.refundAmount).toBe(50);
        });

        it('should fail if payment not found', async () => {
            (mockPaymentModel.findById as jest.Mock).mockReturnValue({
                exec: jest.fn().mockResolvedValue(null)
            });
            await expect(service.refundPayment('pid', 50)).rejects.toThrow(NotFoundException);
        });

        it('should fail if refund amount is too high', async () => {
            const mockPayment = {
                _id: 'pid',
                status: 'completed',
                amount: 100,
                save: jest.fn(),
            };
            (mockPaymentModel.findById as jest.Mock).mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockPayment)
            });
            await expect(service.refundPayment('pid', 150)).rejects.toThrow(BadRequestException);
        });
    });
});
