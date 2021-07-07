import { getGQLFilter } from '../Utils/queries';

describe('Get GQL filter from filter object from', () => {
  test('a simple option filter', async () => {
    const filter = { a: { selectedValues: ['foo', 'bar'] } };
    const gqlFilter = { AND: [{ IN: { a: ['foo', 'bar'] } }] };
    expect(getGQLFilter(filter)).toEqual(gqlFilter);
  });

  test('a simple option filter with combine mode OR', () => {
    const filter = {
      a: { __combineMode: 'OR', selectedValues: ['foo', 'bar'] },
    };
    const gqlFilter = { AND: [{ IN: { a: ['foo', 'bar'] } }] };
    expect(getGQLFilter(filter)).toEqual(gqlFilter);
  });

  test('a simple option filter with combine mode AND', () => {
    const filter = {
      a: { __combineMode: 'AND', selectedValues: ['foo', 'bar'] },
    };
    const gqlFilter = {
      AND: [{ AND: [{ IN: { a: ['foo'] } }, { IN: { a: ['bar'] } }] }],
    };
    expect(getGQLFilter(filter)).toEqual(gqlFilter);
  });

  test('a simple range filter', () => {
    const filter = { a: { lowerBound: 0, upperBound: 1 } };
    const gqlFilter = {
      AND: [{ AND: [{ '>=': { a: 0 } }, { '<=': { a: 1 } }] }],
    };
    expect(getGQLFilter(filter)).toEqual(gqlFilter);
  });

  test('simple filters', () => {
    const filter = {
      a: { selectedValues: ['foo', 'bar'] },
      b: { __combineMode: 'AND', selectedValues: ['foo', 'bar'] },
      c: { lowerBound: 0, upperBound: 1 },
    };
    const gqlFilter = {
      AND: [
        { IN: { a: ['foo', 'bar'] } },
        { AND: [{ IN: { b: ['foo'] } }, { IN: { b: ['bar'] } }] },
        { AND: [{ '>=': { c: 0 } }, { '<=': { c: 1 } }] },
      ],
    };
    expect(getGQLFilter(filter)).toEqual(gqlFilter);
  });

  test('a combine mode only filter', () => {
    const filter = { a: { __combineMode: 'OR' } };
    const gqlFilter = { AND: [] };
    expect(getGQLFilter(filter)).toEqual(gqlFilter);
  });

  test('an invalid filter', () => {
    const filter = { a: {} };
    expect(() => getGQLFilter(filter)).toThrow(
      `Invalid filter object ${filter.a}`
    );
  });

  test('a nested filter', () => {
    const filter = { 'a.b': { selectedValues: ['foo', 'bar'] } };
    const gqlFilter = {
      AND: [{ nested: { path: 'a', AND: [{ IN: { b: ['foo', 'bar'] } }] } }],
    };
    expect(getGQLFilter(filter)).toEqual(gqlFilter);
  });

  test('nested filters with same parent path', () => {
    const filter = {
      'a.b': { selectedValues: ['foo', 'bar'] },
      'a.c': { lowerBound: 0, upperBound: 1 },
    };
    const gqlFilter = {
      AND: [
        {
          nested: {
            path: 'a',
            AND: [
              { IN: { b: ['foo', 'bar'] } },
              { AND: [{ '>=': { c: 0 } }, { '<=': { c: 1 } }] },
            ],
          },
        },
      ],
    };
    expect(getGQLFilter(filter)).toEqual(gqlFilter);
  });

  test('nested filters with different parent paths', () => {
    const filter = {
      'a.b': { selectedValues: ['foo', 'bar'] },
      'c.d': { lowerBound: 0, upperBound: 1 },
    };
    const gqlFilter = {
      AND: [
        {
          nested: {
            path: 'a',
            AND: [{ IN: { b: ['foo', 'bar'] } }],
          },
        },
        {
          nested: {
            path: 'c',
            AND: [{ AND: [{ '>=': { d: 0 } }, { '<=': { d: 1 } }] }],
          },
        },
      ],
    };
    expect(getGQLFilter(filter)).toEqual(gqlFilter);
  });

  test('various filters', () => {
    const filter = {
      a: { selectedValues: ['foo', 'bar'] },
      'b.c': { __combineMode: 'AND', selectedValues: ['foo', 'bar'] },
      'b.d': { lowerBound: 0, upperBound: 1 },
      e: { __combineMode: 'OR' },
      'f.g': { lowerBound: 0, upperBound: 1 },
    };
    const gqlFilter = {
      AND: [
        { IN: { a: ['foo', 'bar'] } },
        {
          nested: {
            path: 'b',
            AND: [
              { AND: [{ IN: { c: ['foo'] } }, { IN: { c: ['bar'] } }] },
              { AND: [{ '>=': { d: 0 } }, { '<=': { d: 1 } }] },
            ],
          },
        },
        {
          nested: {
            path: 'f',
            AND: [{ AND: [{ '>=': { g: 0 } }, { '<=': { g: 1 } }] }],
          },
        },
      ],
    };
    expect(getGQLFilter(filter)).toEqual(gqlFilter);
  });
});
