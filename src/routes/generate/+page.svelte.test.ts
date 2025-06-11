import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import GeneratePage from './+page.svelte';

// Mock fetch
global.fetch = vi.fn();

// Mock FingerprintJS
vi.mock('@fingerprintjs/fingerprintjs', () => ({
	default: {
		load: vi.fn().mockResolvedValue({
			get: vi.fn().mockResolvedValue({
				visitorId: 'test-visitor-id',
				components: {},
				confidence: { score: 0.9 }
			})
		})
	}
}));

describe('Generate Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(global.fetch as any).mockReset();
	});

	it('should render the generate form', () => {
		const { getByText, getByLabelText } = render(GeneratePage);
		
		expect(getByText('Generate Tracking Pixel')).toBeTruthy();
		expect(getByText('Pixel Configuration')).toBeTruthy();
		expect(getByLabelText('Label (Optional)')).toBeTruthy();
	});

	it('should show terms of service text', () => {
		const { getByText } = render(GeneratePage);
		
		expect(getByText(/By clicking "Generate Tracking Pixel"/)).toBeTruthy();
		expect(getByText(/Terms of Service/)).toBeTruthy();
	});

	it('should generate pixel on button click', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				id: 'new-pixel-id',
				trackingUrl: 'http://localhost/api/track/new-pixel-id',
				statsUrl: 'http://localhost/stats/new-pixel-id'
			})
		});

		const { getByText, getByLabelText } = render(GeneratePage);
		
		// Fill in label
		const labelInput = getByLabelText('Label (Optional)') as HTMLInputElement;
		await fireEvent.input(labelInput, { target: { value: 'Test Campaign' } });
		
		// Click generate button
		const generateButton = getByText('Generate Tracking Pixel');
		await fireEvent.click(generateButton);
		
		// Wait for the response
		await waitFor(() => {
			expect(getByText('Your tracking pixel has been generated successfully!')).toBeTruthy();
		});
		
		// Check if fetch was called with correct data
		expect(global.fetch).toHaveBeenCalledWith('/api/pixels', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: expect.stringContaining('"label":"Test Campaign"')
		});
	});

	it('should show embed code after generation', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				id: 'test-id',
				trackingUrl: 'http://localhost/api/track/test-id',
				statsUrl: 'http://localhost/stats/test-id'
			})
		});

		const { getByText } = render(GeneratePage);
		
		const generateButton = getByText('Generate Tracking Pixel');
		await fireEvent.click(generateButton);
		
		await waitFor(() => {
			expect(getByText('Embed Code')).toBeTruthy();
			expect(getByText(/img src=/)).toBeTruthy();
		});
	});

	it('should handle API errors', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 500
		});

		const { getByText } = render(GeneratePage);
		
		const generateButton = getByText('Generate Tracking Pixel');
		await fireEvent.click(generateButton);
		
		await waitFor(() => {
			expect(getByText('Failed to generate pixel. Please try again.')).toBeTruthy();
		});
	});

	it('should allow generating another pixel', async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				id: 'test-id',
				trackingUrl: 'http://localhost/api/track/test-id',
				statsUrl: 'http://localhost/stats/test-id'
			})
		});

		const { getByText } = render(GeneratePage);
		
		const generateButton = getByText('Generate Tracking Pixel');
		await fireEvent.click(generateButton);
		
		await waitFor(() => {
			expect(getByText('Generate Another')).toBeTruthy();
		});
		
		const anotherButton = getByText('Generate Another');
		await fireEvent.click(anotherButton);
		
		// Should show the form again
		expect(getByText('Pixel Configuration')).toBeTruthy();
	});
});