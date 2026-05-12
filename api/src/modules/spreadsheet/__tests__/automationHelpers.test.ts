import { omitPreviousRowSnapshot } from '../automationHelpers';

describe('omitPreviousRowSnapshot', () => {
    test('strips __previous and keeps other keys', () => {
        const out = omitPreviousRowSnapshot({
            id: '1',
            name: 'A',
            __previous: { name: 'B' },
        });
        expect(out).toEqual({ id: '1', name: 'A' });
        expect((out as Record<string, unknown>).__previous).toBeUndefined();
    });

    test('non-objects become empty records', () => {
        expect(omitPreviousRowSnapshot(null)).toEqual({});
        expect(omitPreviousRowSnapshot(undefined)).toEqual({});
        expect(omitPreviousRowSnapshot([])).toEqual({});
        expect(omitPreviousRowSnapshot('x')).toEqual({});
    });
});
