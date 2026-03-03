/**
 * @fileoverview shared/constants/skills.ts — Global static skill library.
 *
 * Skills are defined here as plain constants — no Firestore, no org dependency.
 * Any user account can hold any of these skills via SkillGrant.tagSlug.
 *
 * Taxonomy (two-level):
 *   SkillGroup (大項目, 9 groups)  →  SkillSubCategory (子項目, 25 sub-categories)  →  SkillDefinition
 *
 * To add a new skill: append an entry to SKILLS.
 * The `slug` is the stable identifier used in SkillGrant.tagSlug and
 * SkillRequirement.tagSlug — never change an existing slug (it would
 * orphan existing grants stored in Firestore).
 */

// ---------------------------------------------------------------------------
// Two-level taxonomy types
// ---------------------------------------------------------------------------

/** 大項目 — nine top-level discipline groups. */
export type SkillGroup =
  | 'CivilStructural'   // 營建工程
  | 'MEP'               // 機電工程
  | 'FinishingWorks'    // 裝修工程
  | 'Landscape'         // 景觀工程
  | 'TemporaryWorks'    // 假設工程
  | 'SiteManagement'    // 現場管理與技術支援
  | 'Logistics'         // 物流與環保處理
  | 'BIM'               // 建築資訊模型與技術應用
  | 'ProjectConsulting'; // 專案管理與顧問服務

/** 子項目 — granular discipline sub-categories within each group. */
export type SkillSubCategory =
  // CivilStructural
  | 'ConcreteFormwork'      // 混凝土與模板
  | 'MasonryStructural'     // 砌體與結構
  | 'EarthSpecial'          // 土方與特殊工程
  // MEP
  | 'ElectricalWorks'       // 電氣工程
  | 'MechanicalPlumbing'    // 機械與管道工程
  | 'FireProtection'        // 消防工程
  // FinishingWorks
  | 'WetWorks'              // 濕式作業
  | 'DryWorks'              // 乾式作業
  // Landscape
  | 'SoftLandscape'         // 植栽與綠化
  | 'HardLandscape'         // 硬景施作
  // TemporaryWorks
  | 'TempScaffolding'       // 鷹架工程
  | 'TempShoring'           // 支撐與擋土
  | 'TempSiteFacilities'    // 臨時設施
  // SiteManagement
  | 'HeavyEquipmentOps'     // 重型設備操作
  | 'SpecialistTrades'      // 特殊技藝
  | 'EngineeringTechnical'  // 工程技術
  | 'SafetyQuality'         // 安全與品質
  | 'ProjectMgmt'           // 工程管理
  // Logistics
  | 'MaterialLogistics'     // 物料搬運與物流
  | 'Environmental'         // 環保與廢棄物處理
  // BIM
  | 'BIMModeling'           // BIM建模與協調
  | 'DigitalConstruction'   // 數位施工技術
  // ProjectConsulting
  | 'ContractProcurement'   // 合約與採購管理
  | 'ConsultingAdvisory'    // 顧問諮詢服務
  | 'ClaimsDisputes';       // 索賠與爭議

// ---------------------------------------------------------------------------
// Metadata types
// ---------------------------------------------------------------------------

export interface SkillGroupMeta {
  group: SkillGroup;
  /** Chinese display label (大項目) */
  zhLabel: string;
  /** English display label */
  enLabel: string;
  /** Ordered sub-categories belonging to this group */
  subCategories: readonly SkillSubCategory[];
}

export interface SkillSubCategoryMeta {
  subCategory: SkillSubCategory;
  group: SkillGroup;
  /** Chinese display label (子項目) */
  zhLabel: string;
  /** English display label */
  enLabel: string;
}

export interface SkillDefinition {
  slug: string;
  name: string;
  group: SkillGroup;
  subCategory: SkillSubCategory;
  description?: string;
}

// ---------------------------------------------------------------------------
// Group & sub-category metadata tables (ordered for UI rendering)
// ---------------------------------------------------------------------------

export const SKILL_GROUPS: readonly SkillGroupMeta[] = [
  {
    group: 'CivilStructural',
    zhLabel: '營建工程',
    enLabel: 'Civil & Structural Construction',
    subCategories: ['ConcreteFormwork', 'MasonryStructural', 'EarthSpecial'],
  },
  {
    group: 'MEP',
    zhLabel: '機電工程',
    enLabel: 'MEP — Mechanical, Electrical & Plumbing',
    subCategories: ['ElectricalWorks', 'MechanicalPlumbing', 'FireProtection'],
  },
  {
    group: 'FinishingWorks',
    zhLabel: '裝修工程',
    enLabel: 'Interior & Exterior Finishing',
    subCategories: ['WetWorks', 'DryWorks'],
  },
  {
    group: 'Landscape',
    zhLabel: '景觀工程',
    enLabel: 'Landscape & Green Engineering',
    subCategories: ['SoftLandscape', 'HardLandscape'],
  },
  {
    group: 'TemporaryWorks',
    zhLabel: '假設工程',
    enLabel: 'Temporary Works',
    subCategories: ['TempScaffolding', 'TempShoring', 'TempSiteFacilities'],
  },
  {
    group: 'SiteManagement',
    zhLabel: '現場管理與技術支援',
    enLabel: 'Site Management & Technical Support',
    subCategories: ['HeavyEquipmentOps', 'SpecialistTrades', 'EngineeringTechnical', 'SafetyQuality', 'ProjectMgmt'],
  },
  {
    group: 'Logistics',
    zhLabel: '物流與環保處理',
    enLabel: 'Logistics & Environmental Management',
    subCategories: ['MaterialLogistics', 'Environmental'],
  },
  {
    group: 'BIM',
    zhLabel: '建築資訊模型與技術應用',
    enLabel: 'BIM & Construction Technology',
    subCategories: ['BIMModeling', 'DigitalConstruction'],
  },
  {
    group: 'ProjectConsulting',
    zhLabel: '專案管理與顧問服務',
    enLabel: 'Project Management & Consulting',
    subCategories: ['ContractProcurement', 'ConsultingAdvisory', 'ClaimsDisputes'],
  },
] as const;

export const SKILL_SUB_CATEGORIES: readonly SkillSubCategoryMeta[] = [
  // CivilStructural
  { subCategory: 'ConcreteFormwork',   group: 'CivilStructural', zhLabel: '混凝土與模板',      enLabel: 'Concrete & Formwork' },
  { subCategory: 'MasonryStructural',  group: 'CivilStructural', zhLabel: '砌體與結構',        enLabel: 'Masonry & Structural' },
  { subCategory: 'EarthSpecial',       group: 'CivilStructural', zhLabel: '土方與特殊工程',    enLabel: 'Earthwork & Special Works' },
  // MEP
  { subCategory: 'ElectricalWorks',    group: 'MEP',             zhLabel: '電氣工程',          enLabel: 'Electrical Works' },
  { subCategory: 'MechanicalPlumbing', group: 'MEP',             zhLabel: '機械與管道工程',    enLabel: 'Mechanical & Plumbing' },
  { subCategory: 'FireProtection',     group: 'MEP',             zhLabel: '消防工程',          enLabel: 'Fire Protection' },
  // FinishingWorks
  { subCategory: 'WetWorks',           group: 'FinishingWorks',  zhLabel: '濕式作業',          enLabel: 'Wet Works' },
  { subCategory: 'DryWorks',           group: 'FinishingWorks',  zhLabel: '乾式作業',          enLabel: 'Dry Works' },
  // Landscape
  { subCategory: 'SoftLandscape',      group: 'Landscape',       zhLabel: '植栽與綠化',        enLabel: 'Planting & Greening' },
  { subCategory: 'HardLandscape',      group: 'Landscape',       zhLabel: '硬景施作',          enLabel: 'Hardscape Works' },
  // TemporaryWorks
  { subCategory: 'TempScaffolding',    group: 'TemporaryWorks',  zhLabel: '鷹架工程',          enLabel: 'Scaffolding Works' },
  { subCategory: 'TempShoring',        group: 'TemporaryWorks',  zhLabel: '支撐與擋土',        enLabel: 'Shoring & Earth Retention' },
  { subCategory: 'TempSiteFacilities', group: 'TemporaryWorks',  zhLabel: '臨時設施',          enLabel: 'Temporary Site Facilities' },
  // SiteManagement
  { subCategory: 'HeavyEquipmentOps',    group: 'SiteManagement', zhLabel: '重型設備操作',     enLabel: 'Heavy Equipment Operation' },
  { subCategory: 'SpecialistTrades',     group: 'SiteManagement', zhLabel: '特殊技藝',         enLabel: 'Specialist Trades' },
  { subCategory: 'EngineeringTechnical', group: 'SiteManagement', zhLabel: '工程技術',         enLabel: 'Engineering Technical' },
  { subCategory: 'SafetyQuality',        group: 'SiteManagement', zhLabel: '安全與品質',       enLabel: 'Safety & Quality' },
  { subCategory: 'ProjectMgmt',          group: 'SiteManagement', zhLabel: '工程管理',         enLabel: 'Project Management' },
  // Logistics
  { subCategory: 'MaterialLogistics', group: 'Logistics', zhLabel: '物料搬運與物流',       enLabel: 'Material Handling & Logistics' },
  { subCategory: 'Environmental',     group: 'Logistics', zhLabel: '環保與廢棄物處理',     enLabel: 'Environmental & Waste Management' },
  // BIM
  { subCategory: 'BIMModeling',          group: 'BIM', zhLabel: 'BIM建模與協調',         enLabel: 'BIM Modeling & Coordination' },
  { subCategory: 'DigitalConstruction',  group: 'BIM', zhLabel: '數位施工技術',           enLabel: 'Digital Construction Technology' },
  // ProjectConsulting
  { subCategory: 'ContractProcurement',  group: 'ProjectConsulting', zhLabel: '合約與採購管理',  enLabel: 'Contract & Procurement' },
  { subCategory: 'ConsultingAdvisory',   group: 'ProjectConsulting', zhLabel: '顧問諮詢服務',    enLabel: 'Consulting & Advisory' },
  { subCategory: 'ClaimsDisputes',       group: 'ProjectConsulting', zhLabel: '索賠與爭議',      enLabel: 'Claims & Disputes' },
] as const;

// ---------------------------------------------------------------------------
// Canonical skill list — add entries here to extend the global library
// ---------------------------------------------------------------------------

export const SKILLS: readonly SkillDefinition[] = [
  // ---------------------------------------------------------------------------
  // 1. 營建工程 — CivilStructural
  // ---------------------------------------------------------------------------

  // 混凝土與模板 — ConcreteFormwork
  { slug: 'concrete-work',      name: 'Concrete Work',        group: 'CivilStructural', subCategory: 'ConcreteFormwork',  description: 'Mixing, pouring and finishing concrete structures.' },
  { slug: 'rebar-installation', name: 'Rebar Installation',   group: 'CivilStructural', subCategory: 'ConcreteFormwork',  description: 'Cutting, bending and tying reinforcement steel.' },
  { slug: 'formwork',           name: 'Formwork',             group: 'CivilStructural', subCategory: 'ConcreteFormwork',  description: 'Assembly and stripping of concrete formwork systems.' },

  // 砌體與結構 — MasonryStructural
  { slug: 'masonry',            name: 'Masonry',              group: 'CivilStructural', subCategory: 'MasonryStructural', description: 'Block, brick and stone laying.' },
  { slug: 'structural-steel',   name: 'Structural Steel',     group: 'CivilStructural', subCategory: 'MasonryStructural', description: 'Erection and connection of steel frames and columns.' },

  // 土方與特殊工程 — EarthSpecial
  { slug: 'earthwork',          name: 'Earthwork',            group: 'CivilStructural', subCategory: 'EarthSpecial',      description: 'Excavation, grading and compaction operations.' },
  { slug: 'waterproofing',      name: 'Waterproofing',        group: 'CivilStructural', subCategory: 'EarthSpecial',      description: 'Membrane application and drainage solutions.' },

  // ---------------------------------------------------------------------------
  // 2. 機電工程 — MEP
  // ---------------------------------------------------------------------------

  // 電氣工程 — ElectricalWorks
  { slug: 'electrical-wiring',     name: 'Electrical Wiring',     group: 'MEP', subCategory: 'ElectricalWorks',    description: 'Low-voltage wiring, conduit and cable installation.' },
  { slug: 'panel-installation',    name: 'Panel Installation',    group: 'MEP', subCategory: 'ElectricalWorks',    description: 'MCC and distribution board assembly and commissioning.' },
  { slug: 'lighting-installation', name: 'Lighting Installation', group: 'MEP', subCategory: 'ElectricalWorks',    description: 'Interior and exterior luminaire fitting and controls.' },

  // 機械與管道工程 — MechanicalPlumbing
  { slug: 'hvac-installation', name: 'HVAC Installation', group: 'MEP', subCategory: 'MechanicalPlumbing', description: 'Air handling units, chillers and ductwork installation.' },
  { slug: 'plumbing',          name: 'Plumbing',          group: 'MEP', subCategory: 'MechanicalPlumbing', description: 'Piping systems for water supply and drainage.' },
  { slug: 'ventilation',       name: 'Ventilation',       group: 'MEP', subCategory: 'MechanicalPlumbing', description: 'Exhaust fans, louvers and mechanical ventilation ducting.' },

  // 消防工程 — FireProtection
  { slug: 'fire-suppression', name: 'Fire Suppression', group: 'MEP', subCategory: 'FireProtection', description: 'Sprinkler, gaseous and foam suppression system installation.' },

  // ---------------------------------------------------------------------------
  // 3. 裝修工程 — FinishingWorks
  // ---------------------------------------------------------------------------

  // 濕式作業 — WetWorks
  { slug: 'plastering', name: 'Plastering', group: 'FinishingWorks', subCategory: 'WetWorks', description: 'Interior and exterior rendering and plastering.' },
  { slug: 'tiling',     name: 'Tiling',     group: 'FinishingWorks', subCategory: 'WetWorks', description: 'Ceramic, porcelain and stone tile installation.' },

  // 乾式作業 — DryWorks
  { slug: 'painting',           name: 'Painting',           group: 'FinishingWorks', subCategory: 'DryWorks', description: 'Surface preparation, priming and finish coat application.' },
  { slug: 'flooring',           name: 'Flooring',           group: 'FinishingWorks', subCategory: 'DryWorks', description: 'Timber, vinyl, epoxy and raised-access floor installation.' },
  { slug: 'glass-installation', name: 'Glass Installation', group: 'FinishingWorks', subCategory: 'DryWorks', description: 'Curtain wall, glazing and mirror fitting.' },

  // ---------------------------------------------------------------------------
  // 4. 景觀工程 — Landscape
  // ---------------------------------------------------------------------------

  // 植栽與綠化 — SoftLandscape
  { slug: 'tree-planting',     name: 'Tree Planting',     group: 'Landscape', subCategory: 'SoftLandscape', description: 'Planting, staking and establishment of trees and shrubs.' },
  { slug: 'turf-installation', name: 'Turf Installation', group: 'Landscape', subCategory: 'SoftLandscape', description: 'Grass seeding, sodding and lawn establishment.' },

  // 硬景施作 — HardLandscape
  { slug: 'hardscape-paving',   name: 'Hardscape Paving',   group: 'Landscape', subCategory: 'HardLandscape', description: 'Stone, concrete and paver path and plaza installation.' },
  { slug: 'irrigation-systems', name: 'Irrigation Systems', group: 'Landscape', subCategory: 'HardLandscape', description: 'Drip, sprinkler and sub-surface irrigation installation.' },

  // ---------------------------------------------------------------------------
  // 5. 現場管理與技術支援 — SiteManagement
  // ---------------------------------------------------------------------------

  // 重型設備操作 — HeavyEquipmentOps
  { slug: 'crane-operation',     name: 'Crane Operation',     group: 'SiteManagement', subCategory: 'HeavyEquipmentOps',    description: 'Tower crane and mobile crane lift planning and operation.' },
  { slug: 'excavator-operation', name: 'Excavator Operation', group: 'SiteManagement', subCategory: 'HeavyEquipmentOps',    description: 'Hydraulic excavator operation for trenching and grading.' },
  { slug: 'rigging',             name: 'Rigging',             group: 'SiteManagement', subCategory: 'HeavyEquipmentOps',    description: 'Slinging, shackling and load calculation for hoisting.' },

  // 特殊技藝 — SpecialistTrades
  { slug: 'welding', name: 'Welding', group: 'SiteManagement', subCategory: 'SpecialistTrades', description: 'MIG, TIG and arc welding of structural and pipe joints.' },

  // 工程技術 — EngineeringTechnical
  { slug: 'surveying',        name: 'Surveying',        group: 'SiteManagement', subCategory: 'EngineeringTechnical', description: 'Total station and GPS setout, as-built verification.' },
  { slug: 'structural-design',name: 'Structural Design',group: 'SiteManagement', subCategory: 'EngineeringTechnical', description: 'Load analysis and structural member sizing.' },
  { slug: 'cad-drafting',     name: 'CAD Drafting',     group: 'SiteManagement', subCategory: 'EngineeringTechnical', description: 'AutoCAD / Revit 2D and 3D construction drawings.' },
  { slug: 'blueprint-reading',name: 'Blueprint Reading',group: 'SiteManagement', subCategory: 'EngineeringTechnical', description: 'Interpretation of architectural and structural drawings.' },

  // 安全與品質 — SafetyQuality
  { slug: 'safety-management',  name: 'Safety Management',  group: 'SiteManagement', subCategory: 'SafetyQuality', description: 'HSE planning, toolbox talks and incident investigation.' },
  { slug: 'quality-inspection', name: 'Quality Inspection', group: 'SiteManagement', subCategory: 'SafetyQuality', description: 'NDT, dimensional checks and defect reporting.' },

  // 工程管理 — ProjectMgmt
  { slug: 'site-supervision',   name: 'Site Supervision',   group: 'SiteManagement', subCategory: 'ProjectMgmt', description: 'Day-to-day coordination of subcontractors and labour.' },
  { slug: 'project-management', name: 'Project Management', group: 'SiteManagement', subCategory: 'ProjectMgmt', description: 'Programme planning, cost control and stakeholder reporting.' },

  // ---------------------------------------------------------------------------
  // 6. 物流與環保處理 — Logistics
  // ---------------------------------------------------------------------------

  // 物料搬運與物流 — MaterialLogistics
  { slug: 'scaffolding-erection', name: 'Scaffolding Erection', group: 'Logistics', subCategory: 'MaterialLogistics', description: 'Erection and dismantling of system scaffolding and temporary works.' },
  { slug: 'material-handling',    name: 'Material Handling',    group: 'Logistics', subCategory: 'MaterialLogistics', description: 'Forklift, pallet jack and on-site logistics coordination.' },

  // 環保與廢棄物處理 — Environmental
  { slug: 'waste-management',    name: 'Waste Management',    group: 'Logistics', subCategory: 'Environmental', description: 'Waste segregation, disposal and recycling on construction sites.' },
  { slug: 'dust-noise-control',  name: 'Dust & Noise Control',group: 'Logistics', subCategory: 'Environmental', description: 'Site hoarding, dust suppression and noise mitigation measures.' },

  // ---------------------------------------------------------------------------
  // 7. 假設工程 — TemporaryWorks
  // ---------------------------------------------------------------------------

  // 鷹架工程 — TempScaffolding
  { slug: 'system-scaffolding',    name: 'System Scaffolding',    group: 'TemporaryWorks', subCategory: 'TempScaffolding',    description: 'Cup-lock and frame system scaffolding erection and dismantling.' },
  { slug: 'suspended-scaffolding', name: 'Suspended Scaffolding', group: 'TemporaryWorks', subCategory: 'TempScaffolding',    description: 'Cantilever and suspended scaffold design and installation.' },

  // 支撐與擋土 — TempShoring
  { slug: 'shoring-systems',   name: 'Shoring Systems',   group: 'TemporaryWorks', subCategory: 'TempShoring', description: 'Steel strut and diaphragm wall propping systems installation.' },
  { slug: 'earth-retention',   name: 'Earth Retention',   group: 'TemporaryWorks', subCategory: 'TempShoring', description: 'Sheet piling, soldier piles and shotcrete retaining works.' },

  // 臨時設施 — TempSiteFacilities
  { slug: 'site-hoarding',  name: 'Site Hoarding',    group: 'TemporaryWorks', subCategory: 'TempSiteFacilities', description: 'Hoarding panels, hoardings and site boundary enclosures.' },
  { slug: 'temp-utilities', name: 'Temporary Utilities', group: 'TemporaryWorks', subCategory: 'TempSiteFacilities', description: 'Temporary power, water supply and site office setup.' },

  // ---------------------------------------------------------------------------
  // 8. 建築資訊模型與技術應用 — BIM
  // ---------------------------------------------------------------------------

  // BIM建模與協調 — BIMModeling
  { slug: 'bim-modeling',    name: 'BIM Modeling',    group: 'BIM', subCategory: 'BIMModeling', description: 'Revit/ArchiCAD 3D model authoring and federated model management.' },
  { slug: 'clash-detection', name: 'Clash Detection', group: 'BIM', subCategory: 'BIMModeling', description: 'MEP/structural clash detection and coordination workflows in Navisworks.' },

  // 數位施工技術 — DigitalConstruction
  { slug: '4d-scheduling',           name: '4D Construction Scheduling', group: 'BIM', subCategory: 'DigitalConstruction', description: 'Linking programme schedules to BIM model elements for 4D simulation.' },
  { slug: 'construction-simulation', name: 'Construction Simulation',    group: 'BIM', subCategory: 'DigitalConstruction', description: 'Digital twin and construction sequence simulation.' },

  // ---------------------------------------------------------------------------
  // 9. 專案管理與顧問服務 — ProjectConsulting
  // ---------------------------------------------------------------------------

  // 合約與採購管理 — ContractProcurement
  { slug: 'contract-administration', name: 'Contract Administration', group: 'ProjectConsulting', subCategory: 'ContractProcurement', description: 'NEC/FIDIC contract management, certification and variation assessment.' },
  { slug: 'quantity-surveying',      name: 'Quantity Surveying',      group: 'ProjectConsulting', subCategory: 'ContractProcurement', description: 'Cost estimation, BOQ preparation and cost control.' },

  // 顧問諮詢服務 — ConsultingAdvisory
  { slug: 'value-engineering',   name: 'Value Engineering',   group: 'ProjectConsulting', subCategory: 'ConsultingAdvisory', description: 'Structured VE workshops and buildability reviews.' },
  { slug: 'feasibility-studies', name: 'Feasibility Studies', group: 'ProjectConsulting', subCategory: 'ConsultingAdvisory', description: 'Pre-project feasibility analysis and option appraisals.' },

  // 索賠與爭議 — ClaimsDisputes
  { slug: 'claims-management',  name: 'Claims Management',  group: 'ProjectConsulting', subCategory: 'ClaimsDisputes', description: 'Contractual claim preparation, entitlement analysis and negotiation.' },
  { slug: 'dispute-resolution', name: 'Dispute Resolution', group: 'ProjectConsulting', subCategory: 'ClaimsDisputes', description: 'ADR, mediation, adjudication and expert witness support.' },
] as const;

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------

/** All valid skill slug strings — derived from SKILLS at compile time. */
export type SkillSlug = (typeof SKILLS)[number]['slug'];

/** O(1) lookup map: slug → SkillDefinition */
export const SKILL_BY_SLUG = new Map<string, SkillDefinition>(
  SKILLS.map(s => [s.slug, s])
);

/** O(1) lookup map: SkillGroup key → SkillGroupMeta */
export const SKILL_GROUP_BY_KEY = new Map<SkillGroup, SkillGroupMeta>(
  SKILL_GROUPS.map(g => [g.group, g])
);

/** O(1) lookup map: SkillSubCategory key → SkillSubCategoryMeta */
export const SKILL_SUB_CATEGORY_BY_KEY = new Map<SkillSubCategory, SkillSubCategoryMeta>(
  SKILL_SUB_CATEGORIES.map(s => [s.subCategory, s])
);

/** Returns the SkillDefinition for a slug, or undefined if not found. */
export function findSkill(slug: string): SkillDefinition | undefined {
  return SKILL_BY_SLUG.get(slug);
}
