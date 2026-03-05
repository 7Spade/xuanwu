/**
 * @test VS8 Semantic Graph — Cost Classifier: CostItemType semantic classification
 *
 * Validates pure business logic in _cost-classifier.ts:
 *   1. classifyCostItem — keyword-based classification returning CostItemType
 *
 * Architecture:
 *   [D8]  All tag/semantic logic resides in semantic-graph.slice, not shared-kernel.
 *   [D21] Tag categories governed by VS8.
 */
import { describe, it, expect } from 'vitest'

import { classifyCostItem, CostItemType, shouldMaterializeAsTask } from './_cost-classifier'

describe('classifyCostItem', () => {
  // ─── PROFIT ──────────────────────────────────────────────────────────────
  describe('PROFIT items', () => {
    it('classifies "利潤" as PROFIT', () => {
      expect(classifyCostItem('利潤')).toBe(CostItemType.PROFIT)
    })

    it('classifies a compound entry containing "利潤" as PROFIT', () => {
      // e.g. "3RDTW5BF (Cost Ref: 6122401) (Customer PO: ) 利潤"
      expect(classifyCostItem('3RDTW5BF (Cost Ref: 6122401) (Customer PO: ) 利潤')).toBe(
        CostItemType.PROFIT
      )
    })

    it('classifies "gross profit" as PROFIT (case-insensitive)', () => {
      expect(classifyCostItem('Gross Profit Allocation')).toBe(CostItemType.PROFIT)
    })
  })

  // ─── FINANCIAL ───────────────────────────────────────────────────────────
  describe('FINANCIAL items', () => {
    it('classifies "工程尾款" as FINANCIAL', () => {
      expect(classifyCostItem('工程尾款')).toBe(CostItemType.FINANCIAL)
    })

    it('classifies "3RDTW5BG 工程尾款" as FINANCIAL', () => {
      expect(classifyCostItem('3RDTW5BG 工程尾款')).toBe(CostItemType.FINANCIAL)
    })

    it('classifies "final payment" as FINANCIAL (case-insensitive)', () => {
      expect(classifyCostItem('Final Payment Milestone')).toBe(CostItemType.FINANCIAL)
    })

    it('classifies "retention" as FINANCIAL', () => {
      expect(classifyCostItem('Retention (5%)')).toBe(CostItemType.FINANCIAL)
    })
  })

  // ─── MANAGEMENT ──────────────────────────────────────────────────────────
  describe('MANAGEMENT items', () => {
    it('classifies "配合差旅,運輸,勘查,與工安管理" as MANAGEMENT (工安 + 管理 both match)', () => {
      expect(classifyCostItem('配合差旅,運輸,勘查,與工安管理')).toBe(CostItemType.MANAGEMENT)
    })

    it('classifies "全職安裝工地一級品管及行政人員" as MANAGEMENT', () => {
      expect(classifyCostItem('全職安裝工地一級品管及行政人員')).toBe(CostItemType.MANAGEMENT)
    })

    it('classifies "全職安裝工地領班一人及職安人員一人" as MANAGEMENT', () => {
      expect(classifyCostItem('全職安裝工地領班一人及職安人員一人')).toBe(CostItemType.MANAGEMENT)
    })

    it('classifies "Site Management" as MANAGEMENT (case-insensitive)', () => {
      expect(classifyCostItem('Site Management Overhead')).toBe(CostItemType.MANAGEMENT)
    })

    it('classifies "QC Inspection" as MANAGEMENT (quality control admin)', () => {
      // "quality control" admin oversight → MANAGEMENT.
      // Note: bare "qc" was removed from MANAGEMENT keywords to avoid matching
      // physical commissioning work like "機電檢測QC Test".
      expect(classifyCostItem('QC Inspection quality control')).toBe(CostItemType.MANAGEMENT)
    })

    it('classifies "機電檢測QC Test (TSMC標準)" as EXECUTABLE (EXECUTABLE override fires first)', () => {
      // "機電檢測" and "qc test" appear in the EXECUTABLE override rule which is
      // evaluated before the MANAGEMENT rule, so physical commissioning tests are
      // correctly routed as executable field-work. [D27 fix]
      expect(classifyCostItem('機電檢測QC Test (TSMC標準)')).toBe(CostItemType.EXECUTABLE)
    })
  })

  // ─── ALLOWANCE ───────────────────────────────────────────────────────────
  describe('ALLOWANCE items', () => {
    it('classifies "Consumables 耗材" as ALLOWANCE', () => {
      expect(classifyCostItem('Consumables 耗材')).toBe(CostItemType.ALLOWANCE)
    })

    it('classifies "耗材" alone as ALLOWANCE', () => {
      expect(classifyCostItem('耗材')).toBe(CostItemType.ALLOWANCE)
    })

    it('classifies travel/transport combo as ALLOWANCE', () => {
      // Note: the pure management matcher for "工安管理" fires before allowance rules
      // for "配合差旅,運輸,勘查,與工安管理"; here we test a name without management keywords
      expect(classifyCostItem('差旅與運輸費用')).toBe(CostItemType.ALLOWANCE)
    })

    it('classifies "Miscellaneous" as ALLOWANCE (case-insensitive)', () => {
      expect(classifyCostItem('Miscellaneous Expenses')).toBe(CostItemType.ALLOWANCE)
    })
  })

  // ─── RESOURCE ────────────────────────────────────────────────────────────
  describe('RESOURCE items', () => {
    it('classifies "倉儲" as RESOURCE', () => {
      expect(classifyCostItem('倉儲')).toBe(CostItemType.RESOURCE)
    })

    it('classifies "3RDTW5BG 倉儲" as RESOURCE', () => {
      expect(classifyCostItem('3RDTW5BG 倉儲')).toBe(CostItemType.RESOURCE)
    })

    it('classifies "Warehouse" as RESOURCE (case-insensitive)', () => {
      expect(classifyCostItem('Warehouse Storage')).toBe(CostItemType.RESOURCE)
    })
  })

  // ─── EXECUTABLE ──────────────────────────────────────────────────────────
  describe('EXECUTABLE items', () => {
    it('classifies "保護電驛安裝與配線" as EXECUTABLE', () => {
      expect(classifyCostItem('保護電驛安裝與配線')).toBe(CostItemType.EXECUTABLE)
    })

    it('classifies "增設ACB迴路 1600A" as EXECUTABLE', () => {
      expect(classifyCostItem('增設ACB迴路 1600A')).toBe(CostItemType.EXECUTABLE)
    })

    it('classifies "新設ACB暫放防護" as EXECUTABLE', () => {
      expect(classifyCostItem('新設ACB暫放防護')).toBe(CostItemType.EXECUTABLE)
    })

    it('classifies "ACB搬運工程 堆高機下車" as EXECUTABLE', () => {
      expect(classifyCostItem('ACB搬運工程 堆高機下車')).toBe(CostItemType.EXECUTABLE)
    })

    it('classifies "配合SCADA測試" as EXECUTABLE', () => {
      expect(classifyCostItem('配合SCADA測試')).toBe(CostItemType.EXECUTABLE)
    })

    it('classifies "Testing and commissioning" as EXECUTABLE', () => {
      expect(classifyCostItem('Testing and commissioning')).toBe(CostItemType.EXECUTABLE)
    })

    it('classifies "Construction & Installation" as EXECUTABLE', () => {
      expect(classifyCostItem('Construction & Installation')).toBe(CostItemType.EXECUTABLE)
    })

    it('classifies "Foundation" as EXECUTABLE', () => {
      expect(classifyCostItem('Foundation')).toBe(CostItemType.EXECUTABLE)
    })

    it('classifies "LV Capacitor" as EXECUTABLE', () => {
      expect(classifyCostItem('LV Capacitor')).toBe(CostItemType.EXECUTABLE)
    })

    it('classifies "LV SWGR (including Transformer panel)" as EXECUTABLE', () => {
      expect(classifyCostItem('LV SWGR (including Transformer panel)')).toBe(CostItemType.EXECUTABLE)
    })

    it('classifies "Installation, calculation and Civil interface drawing 套圖作業(Layout、5D/2D)" as EXECUTABLE', () => {
      expect(
        classifyCostItem(
          'Installation, calculation and Civil interface drawing 套圖作業(Layout、5D/2D)'
        )
      ).toBe(CostItemType.EXECUTABLE)
    })

    it('returns EXECUTABLE for an empty string (default)', () => {
      expect(classifyCostItem('')).toBe(CostItemType.EXECUTABLE)
    })

    it('returns EXECUTABLE for an unknown item name (default)', () => {
      expect(classifyCostItem('Some unknown item 未知項目')).toBe(CostItemType.EXECUTABLE)
    })
  })

  // ─── Case insensitivity ──────────────────────────────────────────────────
  describe('case insensitivity', () => {
    it('matches upper-case "PROFIT MARGIN" as PROFIT', () => {
      expect(classifyCostItem('PROFIT MARGIN')).toBe(CostItemType.PROFIT)
    })

    it('matches mixed-case "Final Payment" as FINANCIAL', () => {
      expect(classifyCostItem('Final Payment')).toBe(CostItemType.FINANCIAL)
    })
  })
})

// ─── shouldMaterializeAsTask ─────────────────────────────────────────────────
describe('shouldMaterializeAsTask', () => {
  it('returns true for EXECUTABLE', () => {
    expect(shouldMaterializeAsTask(CostItemType.EXECUTABLE)).toBe(true)
  })

  it('returns false for MANAGEMENT', () => {
    expect(shouldMaterializeAsTask(CostItemType.MANAGEMENT)).toBe(false)
  })

  it('returns false for PROFIT', () => {
    expect(shouldMaterializeAsTask(CostItemType.PROFIT)).toBe(false)
  })

  it('returns false for FINANCIAL', () => {
    expect(shouldMaterializeAsTask(CostItemType.FINANCIAL)).toBe(false)
  })

  it('returns false for RESOURCE', () => {
    expect(shouldMaterializeAsTask(CostItemType.RESOURCE)).toBe(false)
  })

  it('returns false for ALLOWANCE', () => {
    expect(shouldMaterializeAsTask(CostItemType.ALLOWANCE)).toBe(false)
  })
})
