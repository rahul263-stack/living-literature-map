export interface PaperNode {
  id: string;
  title: string;
  authors: string | string[];
  year: number;
  journal: string;
  citations: number;
  community: number;
  community_name: string;
  abstract: string;
  doi: string;
  keywords: string[];
  val: number;
}

export type Modality =
  | 'Empirical'
  | 'Computational'
  | 'Experimental'
  | 'Clinical'
  | 'Theoretical'
  | 'Review'
  | 'Methodological'
  | 'fMRI'
  | 'dMRI'
  | 'EEG'
  | 'MEG'
  | 'TMS'
  | 'Multi'
  | 'Other';

export interface EnrichedPaper extends PaperNode {
  modality: Modality;
  sampleSize: number | null;
  sampleSizeCategory: 'small' | 'medium' | 'large' | null;
  keyFindings: string;
  limitations: string;
  quality: 'green' | 'yellow' | 'red';
  qualityLabel: string;
}

export type SortKey = 'author' | 'year' | 'citations';
export type SortDir = 'asc' | 'desc';

export const MODALITIES: Modality[] = [
  'Empirical',
  'Computational',
  'Experimental',
  'Clinical',
  'Theoretical',
  'Review',
  'Methodological',
];

export const SCHOOL_NAMES: Record<number, string> = {
  0: 'Foundations & Graph Theory',
  1: 'Resting-State fMRI & Default Mode',
  2: 'Structural Connectivity & dMRI',
  3: 'Dynamic FC & Brain States',
  4: 'Clinical Applications',
  5: 'Hubs, Rich-Club & Gradients',
  6: 'Precision Mapping & Individual Differences',
  7: 'Methods, Tools & Parcellations',
  8: 'Recent Advances (arXiv)',
};

export const SCHOOL_ABBR: Record<number, string> = {
  0: 'Foundations',
  1: 'fMRI/DMN',
  2: 'Structural',
  3: 'Dynamic FC',
  4: 'Clinical',
  5: 'Hubs',
  6: 'Precision',
  7: 'Methods',
  8: 'Recent',
};
