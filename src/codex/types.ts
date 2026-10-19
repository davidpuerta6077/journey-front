export enum BlockType {
  HEADING = 'heading',
  TEXT = 'text',
  IMAGE = 'image',
  ALERT = 'alert',
  VIDEO = 'video',
  DIVIDER = 'divider',
  BUTTON = 'button',
  LAYOUT = 'layout',
  ACCORDION = 'accordion',
  FLIPCARD = 'flipcard',
  ICON_CARD = 'icon_card',
  TABLE = 'table',
  CONCLUSION = 'conclusion',
  PODCAST = 'podcast',
  TABS = 'tabs',
  CITATION = 'citation',
  TASK = 'task',
  FORUM = 'forum',
  SABER_COLUMNS = 'saber_columns',
  QUESTIONNAIRE = 'questionnaire',
  MODAL = 'modal',
  POPOVER = 'popover',
  QUIZ = 'quiz',
  TIMELINE = 'timeline',
  STAT_CARD = 'stat_card',
  SECTION_BANNER = 'section_banner',
  BLOCKQUOTE = 'blockquote',
  DOWNLOAD_CARD = 'download_card',
  CODE_BLOCK = 'code_block',
  COLLAPSE_ICON = 'collapse_icon',
  CARD_IMAGE = 'card_image',
  INTRO_CARD = 'intro_card',
}

export interface BlockStyle {
  textAlign?: 'left' | 'center' | 'right';
  backgroundColor?: string;
  color?: string;
  padding?: string;
  fontSize?: string;
  borderRadius?: string;
  customClass?: string;
}

export interface QuizOption {
  id: string;
  label: string;
  value: string;
}

// ── Content interfaces (one per BlockType) ──────────────────────────────────

export interface HeadingContent {
  text?: string;
  level?: string;
  colorClass?: string;
}

export interface TextContent {
  text?: string;
}

export interface ImageContent {
  src?: string;
  alt?: string;
  caption?: string;
  lightbox?: boolean;
  showShadow?: boolean;
  imageStyle?: 'normal' | 'rounded' | 'circle' | 'thumbnail';
  width?: string;
  height?: string;
  modalEnabled?: boolean;
  modalTitle?: string;
}

export interface VideoContent {
  url?: string;
}

export interface TableContent {
  text?: string;
}

export interface AlertContent {
  type?: string;
  text?: string;
  cardStyle?: string;
  headerTitle?: string;
  imageUrl?: string;
}

export interface ButtonContent {
  text?: string;
  url?: string;
  variant?: string;
  isFullWidth?: boolean;
  isBold?: boolean;
  isSolid?: boolean;
  modalEnabled?: boolean;
  modalTitle?: string;
  badgeType?: 'none' | 'pill' | 'inline' | 'dot';
  badgeText?: string;
  badgeColor?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
}

export interface LayoutContent {
  [key: string]: unknown;
}

export interface SaberColumnsContent {
  [key: string]: unknown;
}

export interface AccordionItem {
  id: string;
  title?: string;
  content?: string;
}

export interface AccordionContent {
  items?: AccordionItem[];
  color?: 'none' | 'blue' | 'info' | 'purple' | 'orange' | 'dark' | 'success' | 'danger' | 'secondary';
  showBorder?: boolean;
}

export interface FlipcardContent {
  frontImage?: string;
  backImage?: string;
  frontText?: string;
  backText?: string;
  frontColor?: string;
  backColor?: string;
}

export interface IconCardContent {
  title?: string;
  text?: string;
  icon?: string;
  color?: string;
}

export interface DividerContent {
  [key: string]: unknown;
}

export interface ConclusionContent {
  title?: string;
  text?: string;
  style?: string;
  color?: string;
  showTitle?: boolean;
  titleSize?: string;
}

export interface PodcastContent {
  title?: string;
  url?: string;
  customLabel?: string;
  number?: string;
  icon?: string;
  color?: string;
  showBorder?: boolean;
}

export interface TabsItem {
  id: string;
  title?: string;
  content?: string;
}

export interface TabsContent {
  items?: TabsItem[];
  orientation?: string;
}

export interface CitationContent {
  title?: string;
  text?: string;
  intro?: string;
  iconUrl?: string;
  iconPosition?: string;
  layout?: string;
  iconSize?: string;
  titleColor?: string;
  titleSize?: string;
  bgColor?: string;
  textAlign?: string;
}

export interface TaskContent {
  groupMode?: string;
  itinerary?: string;
  evaluation?: string;
}

export interface ForumContent {
  title?: string;
  text?: string;
}

export interface QuestionnaireContent {
  title?: string;
  text?: string;
}

export interface ModalContent {
  title?: string;
  triggerText?: string;
  triggerType?: 'button' | 'text' | 'badge';
  variant?: string;
  isSolid?: boolean;
  isFullWidth?: boolean;
  align?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  centered?: boolean;
  scrollable?: boolean;
  staticBackdrop?: boolean;
  animation?: boolean;
  showFooter?: boolean;
}

export interface PopoverContent {
  triggerText?: string;
  text?: string;
  placement?: string;
  variant?: string;
}

export interface QuizContent {
  question?: string;
  options?: QuizOption[];
  correctValue?: string;
  feedbackPositive?: string;
  feedbackNegative?: string;
}

export interface TimelineItem {
  id: string;
  title?: string;
  date?: string;
  text?: string;
  imageUrl?: string;
}

export interface TimelineContent {
  color?: string;
  items?: TimelineItem[];
}

export interface StatItem {
  id: string;
  number?: string;
  label?: string;
  icon?: string;
  color?: string;
}

export interface StatCardContent {
  items?: StatItem[];
}


export interface SectionBannerContent {
  title?: string;
  subtitle?: string;
  icon?: string;
  iconSize?: string;
  color?: string;
  style?: string;
}

export interface BlockquoteContent {
  text?: string;
  author?: string;
  source?: string;
  color?: string;
  bqStyle?: string;
  textSize?: string;
  showIcon?: boolean;
}

export interface DownloadItem {
  id: string;
  name?: string;
  url?: string;
  type?: string;
  size?: string;
}

export interface DownloadCardContent {
  items?: DownloadItem[];
}

export interface CodeBlockContent {
  code?: string;
  language?: string;
  showLineNumbers?: boolean;
  filename?: string;
}

export interface CollapseIconContent {
  iconUrl?: string;
  iconSize?: string;
  triggerText?: string;
  triggerColor?: string;
  contentTitle?: string;
  contentText?: string;
  bgColor?: string;
  titleColor?: string;
}

export interface CardImageItem {
  id: string;
  text?: string;
}

export interface CardImageContent {
  imageUrl?: string;
  title?: string;
  titleColor?: string;
  fullWidth?: boolean;
  items?: CardImageItem[];
}

export interface IntroCardContent {
  imageUrl?: string;
  imageWidth?: number;
  imageCol?: string;
  bgColor?: string;
}

// ── Union of all content types ───────────────────────────────────────────────

export type AnyBlockContent =
  | HeadingContent
  | TextContent
  | ImageContent
  | VideoContent
  | TableContent
  | AlertContent
  | ButtonContent
  | LayoutContent
  | SaberColumnsContent
  | AccordionContent
  | FlipcardContent
  | IconCardContent
  | DividerContent
  | ConclusionContent
  | PodcastContent
  | TabsContent
  | CitationContent
  | TaskContent
  | ForumContent
  | QuestionnaireContent
  | ModalContent
  | PopoverContent
  | QuizContent
  | TimelineContent
  | StatCardContent
  | SectionBannerContent
  | BlockquoteContent
  | DownloadCardContent
  | CodeBlockContent
  | CollapseIconContent
  | CardImageContent
  | IntroCardContent;

// ── Discriminated union for BlockData ────────────────────────────────────────

type BlockBase = {
  id: string;
  style: BlockStyle;
  columns?: { id: string; width: string; blocks: BlockData[] }[];
  areas?: Record<string, BlockData[]>;
};

export type BlockData =
  | (BlockBase & { type: BlockType.HEADING;       content: HeadingContent })
  | (BlockBase & { type: BlockType.TEXT;          content: TextContent })
  | (BlockBase & { type: BlockType.IMAGE;         content: ImageContent })
  | (BlockBase & { type: BlockType.ALERT;         content: AlertContent })
  | (BlockBase & { type: BlockType.VIDEO;         content: VideoContent })
  | (BlockBase & { type: BlockType.DIVIDER;       content: DividerContent })
  | (BlockBase & { type: BlockType.BUTTON;        content: ButtonContent })
  | (BlockBase & { type: BlockType.LAYOUT;        content: LayoutContent })
  | (BlockBase & { type: BlockType.ACCORDION;     content: AccordionContent })
  | (BlockBase & { type: BlockType.FLIPCARD;      content: FlipcardContent })
  | (BlockBase & { type: BlockType.ICON_CARD;     content: IconCardContent })
  | (BlockBase & { type: BlockType.TABLE;         content: TableContent })
  | (BlockBase & { type: BlockType.CONCLUSION;    content: ConclusionContent })
  | (BlockBase & { type: BlockType.PODCAST;       content: PodcastContent })
  | (BlockBase & { type: BlockType.TABS;          content: TabsContent })
  | (BlockBase & { type: BlockType.CITATION;      content: CitationContent })
  | (BlockBase & { type: BlockType.TASK;          content: TaskContent })
  | (BlockBase & { type: BlockType.FORUM;         content: ForumContent })
  | (BlockBase & { type: BlockType.SABER_COLUMNS; content: SaberColumnsContent })
  | (BlockBase & { type: BlockType.QUESTIONNAIRE; content: QuestionnaireContent })
  | (BlockBase & { type: BlockType.MODAL;         content: ModalContent })
  | (BlockBase & { type: BlockType.POPOVER;       content: PopoverContent })
  | (BlockBase & { type: BlockType.QUIZ;          content: QuizContent })
  | (BlockBase & { type: BlockType.TIMELINE;      content: TimelineContent })
  | (BlockBase & { type: BlockType.STAT_CARD;     content: StatCardContent })
  | (BlockBase & { type: BlockType.SECTION_BANNER; content: SectionBannerContent })
  | (BlockBase & { type: BlockType.BLOCKQUOTE;    content: BlockquoteContent })
  | (BlockBase & { type: BlockType.DOWNLOAD_CARD; content: DownloadCardContent })
  | (BlockBase & { type: BlockType.CODE_BLOCK;    content: CodeBlockContent })
  | (BlockBase & { type: BlockType.COLLAPSE_ICON; content: CollapseIconContent })
  | (BlockBase & { type: BlockType.CARD_IMAGE;    content: CardImageContent })
  | (BlockBase & { type: BlockType.INTRO_CARD;    content: IntroCardContent });

// ── Partial update type (used by onUpdate / updateBlock) ─────────────────────

export interface BlockUpdate {
  style?: BlockStyle;
  content?: Record<string, unknown>;
  columns?: { id: string; width: string; blocks: BlockData[] }[];
  areas?: Record<string, BlockData[]>;
}

export interface EditorState {
  blocks: BlockData[];
  selectedBlockId: string | null;
}
