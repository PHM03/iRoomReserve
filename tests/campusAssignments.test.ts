import { describe, expect, it } from 'vitest';

import {
  getCampusName,
  getManagedBuildingIdsForCampus,
  isCampusManagedBuilding,
  resolveCampusAssignment,
} from '../lib/campusAssignments';
import { assertCanManageBuilding } from '../lib/server/route-guards';

describe('campus assignments', () => {
  it('maps legacy GD building assignments to the main campus', () => {
    const assignment = resolveCampusAssignment({
      assignedBuildingIds: ['gd2'],
    });

    expect(assignment).toEqual({
      campus: 'main',
      campusName: 'SDCA Main Campus',
    });
  });

  it('maps legacy digital campus assignments to the digi campus', () => {
    const assignment = resolveCampusAssignment({
      assignedBuilding: 'SDCA Digital Campus',
    });

    expect(assignment).toEqual({
      campus: 'digi',
      campusName: 'SDCA Digi Campus',
    });
  });

  it('returns the managed buildings for each campus', () => {
    expect(getManagedBuildingIdsForCampus('main')).toEqual(['gd1', 'gd2', 'gd3']);
    expect(getManagedBuildingIdsForCampus('digi')).toEqual(['sdca-digital-campus']);
    expect(getCampusName('digi')).toBe('SDCA Digi Campus');
  });

  it('matches campus access against buildings in that campus', () => {
    expect(isCampusManagedBuilding('main', 'gd3')).toBe(true);
    expect(isCampusManagedBuilding('main', 'sdca-digital-campus')).toBe(false);
    expect(isCampusManagedBuilding('digi', 'sdca-digital-campus')).toBe(true);
  });
});

describe('assertCanManageBuilding', () => {
  it('allows a main campus admin to manage any main campus building', () => {
    expect(() =>
      assertCanManageBuilding(
        {
          uid: 'admin-1',
          role: 'Administrator',
          email: 'admin@sdca.edu.ph',
          campus: 'main',
          assignedBuildingId: null,
          assignedBuildingIds: [],
          verified: true,
        },
        'gd2'
      )
    ).not.toThrow();
  });

  it('rejects access outside of the assigned campus', () => {
    expect(() =>
      assertCanManageBuilding(
        {
          uid: 'admin-1',
          role: 'Administrator',
          email: 'admin@sdca.edu.ph',
          campus: 'main',
          assignedBuildingId: null,
          assignedBuildingIds: [],
          verified: true,
        },
        'sdca-digital-campus'
      )
    ).toThrow();
  });
});
