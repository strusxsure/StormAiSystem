import { GoogleGenAI } from "@google/genai";

// OpenRouter Configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const SITE_URL = "https://stormai.app"; 
const SITE_NAME = "StormAI";

const getAiInstance = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY as string | undefined;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("API Key is missing. The application cannot connect to Gemini.");
  }
  return new GoogleGenAI({ apiKey });
};

async function generateWithRetry(
  client: GoogleGenAI, 
  modelName: string, 
  params: any, 
  retries = 3
): Promise<any> {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await client.models.generateContent({
        model: modelName,
        ...params
      });
    } catch (error: any) {
      lastError = error;
      const errString = error.toString().toLowerCase();
      if (errString.includes('429') || errString.includes('quota') || errString.includes('resource_exhausted')) {
          console.warn(`Quota exceeded for ${modelName}, aborting retries.`);
          throw new Error(`Quota exceeded for ${modelName}. Please try a free model or upgrade keys.`);
      }
      const isRetryable = errString.includes('503') || errString.includes('overloaded') || errString.includes('network error') || errString.includes('fetch failed');
      if (isRetryable && i < retries - 1) {
        const waitTime = 2000 * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      break;
    }
  }
  throw lastError;
}

const sanitizeCode = (code: string): string => {
    let result = code;
    
    // 1. Remove Markdown artifacts
    result = result.replace(/^>\s*/gm, '');

    // 2. Aggressively remove ALL imports to prevent conflicts
    result = result.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');
    result = result.replace(/import\s+['"][^'"]+['"];?/g, '');
    
    // 3. Clean up residual "from" lines
    result = result.replace(/^\s*\}?\s*from\s+['"][^'"]+['"];?/gm, '');

    // 4. Ensure "export default App" exists
    if (!result.includes('export default')) {
        if (result.includes('function App') || result.includes('const App')) {
            result += '\nexport default App;';
        }
    }

    return result;
};

const extractCodeBlock = (rawText: string): string => {
    const codeBlockRegex = /```(?:tsx|javascript|jsx|js|typescript|json)?\s*([\s\S]*?)```/;
    const match = rawText.match(codeBlockRegex);
    let code = "";
    if (match && match[1]) {
        code = match[1].trim();
    } else {
        // Fallback extraction
        const importIdx = rawText.indexOf('import ');
        const constAppIdx = rawText.indexOf('const App');
        const functionAppIdx = rawText.indexOf('function App');
        
        if (importIdx !== -1) {
            code = rawText.substring(importIdx).trim();
        } else if (constAppIdx !== -1) {
            code = rawText.substring(constAppIdx).trim();
        } else if (functionAppIdx !== -1) {
            code = rawText.substring(functionAppIdx).trim();
        } else {
            code = rawText.trim();
        }
    }
    return sanitizeCode(code);
};

// A comprehensive list of all lucide-react icon names in PascalCase
const allLucideIcons = new Set([
  'AArrowDown', 'AArrowUp', 'ALargeSmall', 'Accessibility', 'Activity', 'AirVent', 'Airplay', 'AlarmClock', 'AlarmClockCheck', 'AlarmClockMinus', 'AlarmClockOff', 'AlarmClockPlus', 'AlarmSmoke', 'Album', 'AlignCenterHorizontal', 'AlignCenterVertical', 'AlignEndHorizontal', 'AlignEndVertical', 'AlignHorizontalDistributeCenter', 'AlignHorizontalDistributeEnd', 'AlignHorizontalDistributeStart', 'AlignHorizontalJustifyCenter', 'AlignHorizontalJustifyEnd', 'AlignHorizontalJustifyStart', 'AlignHorizontalSpaceAround', 'AlignHorizontalSpaceBetween', 'AlignStartHorizontal', 'AlignStartVertical', 'AlignVerticalDistributeCenter', 'AlignVerticalDistributeEnd', 'AlignVerticalDistributeStart', 'AlignVerticalJustifyCenter', 'AlignVerticalJustifyEnd', 'AlignVerticalJustifyStart', 'AlignVerticalSpaceAround', 'AlignVerticalSpaceBetween', 'Ambulance', 'Ampersand', 'Ampersands', 'Amphora', 'Anchor', 'Angry', 'Annoyed', 'Antenna', 'Anvil', 'Aperture', 'AppWindow', 'AppWindowMac', 'Apple', 'Archive', 'ArchiveRestore', 'ArchiveX', 'Armchair', 'ArrowBigDown', 'ArrowBigDownDash', 'ArrowBigLeft', 'ArrowBigLeftDash', 'ArrowBigRight', 'ArrowBigRightDash', 'ArrowBigUp', 'ArrowBigUpDash', 'ArrowDown', 'ArrowDown01', 'ArrowDown10', 'ArrowDownAZ', 'ArrowDownFromLine', 'ArrowDownLeft', 'ArrowDownNarrowWide', 'ArrowDownRight', 'ArrowDownToDot', 'ArrowDownToLine', 'ArrowDownUp', 'ArrowDownWideNarrow', 'ArrowDownZA', 'ArrowLeft', 'ArrowLeftFromLine', 'ArrowLeftRight', 'ArrowLeftToLine', 'ArrowRight', 'ArrowRightFromLine', 'ArrowRightLeft', 'ArrowRightToLine', 'ArrowUp', 'ArrowUp01', 'ArrowUp10', 'ArrowUpAZ', 'ArrowUpDown', 'ArrowUpFromDot', 'ArrowUpFromLine', 'ArrowUpLeft', 'ArrowUpNarrowWide', 'ArrowUpRight', 'ArrowUpToLine', 'ArrowUpWideNarrow', 'ArrowUpZA', 'ArrowsUpFromLine', 'Asterisk', 'AtSign', 'Atom', 'AudioLines', 'AudioWaveform', 'Award', 'Axe', 'Axis3d', 'Baby', 'Backpack', 'Badge', 'BadgeAlert', 'BadgeCent', 'BadgeCheck', 'BadgeDollarSign', 'BadgeEuro', 'BadgeIndianRupee', 'BadgeInfo', 'BadgeJapaneseYen', 'BadgeMinus', 'BadgePercent', 'BadgePlus', 'BadgePoundSterling', 'BadgeQuestionMark', 'BadgeRussianRuble', 'BadgeSwissFranc', 'BadgeX', 'BaggageClaim', 'Ban', 'Banana', 'Banknote', 'BarChart', 'BarChart2', 'BarChart3', 'BarChart4', 'BarChartBig', 'BarChartHorizontal', 'BarChartHorizontalBig', 'Barcode', 'Baseline', 'Bath', 'Battery', 'BatteryCharging', 'BatteryFull', 'BatteryLow', 'BatteryMedium', 'BatteryWarning', 'Beaker', 'Bean', 'BeanOff', 'Bed', 'BedDouble', 'BedSingle', 'Beef', 'Beer', 'BeerOff', 'Bell', 'BellDot', 'BellElectric', 'BellMinus', 'BellOff', 'BellPlus', 'BellRing', 'BetweenHorizontalEnd', 'BetweenHorizontalStart', 'BetweenVerticalEnd', 'BetweenVerticalStart', 'Bike', 'Binary', 'Biohazard', 'Bird', 'Bitcoin', 'Blinds', 'Blocks', 'Bluetooth', 'BluetoothConnected', 'BluetoothOff', 'BluetoothSearching', 'Bold', 'Bomb', 'Bone', 'Book', 'BookA', 'BookAudio', 'BookCheck', 'BookCopy', 'BookDashed', 'BookDown', 'BookHeadphones', 'BookHeart', 'BookImage', 'BookKey', 'BookLock', 'BookMarked', 'BookMinus', 'BookOpen', 'BookOpenCheck', 'BookOpenText', 'BookPlus', 'BookText', 'BookType', 'BookUp', 'BookUp2', 'BookUser', 'BookX', 'Bookmark', 'BookmarkCheck', 'BookmarkMinus', 'BookmarkPlus', 'BookmarkX', 'BoomBox', 'Bot', 'BotMessageSquare', 'BotOff', 'Box', 'BoxSelect', 'Boxes', 'Braces', 'Brackets', 'Brain', 'BrainCircuit', 'BrainCog', 'Briefcase', 'BriefcaseBusiness', 'BriefcaseMedical', 'BringToFront', 'Brush', 'Bug', 'BugOff', 'BugPlay', 'Building', 'Building2', 'Bus', 'BusFront', 'BusStop', 'Cable', 'CableCar', 'Cake', 'CakeSlice', 'Calculator', 'Calendar', 'CalendarCheck', 'CalendarCheck2', 'CalendarClock', 'CalendarDays', 'CalendarFold', 'CalendarHeart', 'CalendarMinus', 'CalendarMinus2', 'CalendarOff', 'CalendarPlus', 'CalendarPlus2', 'CalendarRange', 'CalendarSearch', 'CalendarX', 'CalendarX2', 'Camera', 'CameraOff', 'CandlestickChart', 'Candy', 'CandyCane', 'CandyOff', 'Cannabis', 'Car', 'CarFront', 'CarTaxiFront', 'Caravan', 'Carrot', 'CaseLower', 'CaseSensitive', 'CaseUpper', 'CassetteTape', 'Cast', 'Castle', 'Cat', 'Cctv', 'Check', 'CheckCheck', 'CheckCircle', 'CheckCircle2', 'CheckSquare', 'CheckSquare2', 'ChefHat', 'Cherry', 'ChevronDown', 'ChevronFirst', 'ChevronLast', 'ChevronLeft', 'ChevronRight', 'ChevronUp', 'ChevronsDown', 'ChevronsDownUp', 'ChevronsLeft', 'ChevronsLeftRight', 'ChevronsRight', 'ChevronsRightLeft', 'ChevronsUp', 'ChevronsUpDown', 'Chrome', 'Church', 'Cigarette', 'CigaretteOff', 'Circle', 'CircleAlert', 'CircleArrowDown', 'CircleArrowLeft', 'CircleArrowOutDownLeft', 'CircleArrowOutDownRight', 'CircleArrowOutUpLeft', 'CircleArrowOutUpRight', 'CircleArrowUp', 'CircleCheck', 'CircleCheckBig', 'CircleChevronDown', 'CircleChevronLeft', 'CircleChevronRight', 'CircleChevronUp', 'CircleDashed', 'CircleDollarSign', 'CircleDot', 'CircleDotDashed', 'CircleEllipsis', 'CircleEqual', 'CircleFadingPlus', 'CircleGauge', 'CircleHelp', 'CircleMinus', 'CircleOff', 'CircleParking', 'CircleParkingOff', 'CirclePause', 'CirclePercent', 'CirclePlay', 'CirclePlus', 'CirclePower', 'CircleSlash', 'CircleSlash2', 'CircleStop', 'CircleUser', 'CircleUserRound', 'CircleX', 'CircuitBoard', 'Citrus', 'Clapperboard', 'Clipboard', 'ClipboardCheck', 'ClipboardCopy', 'ClipboardList', 'ClipboardMinus', 'ClipboardPaste', 'ClipboardPlus', 'ClipboardType', 'ClipboardX', 'Clock', 'Clock1', 'Clock10', 'Clock11', 'Clock12', 'Clock2', 'Clock3', 'Clock4', 'Clock5', 'Clock6', 'Clock7', 'Clock8', 'Clock9', 'Cloud', 'CloudCog', 'CloudDrizzle', 'CloudFog', 'CloudHail', 'CloudLightning', 'CloudMoon', 'CloudMoonRain', 'CloudOff', 'CloudRain', 'CloudRainWind', 'CloudSnow', 'CloudSun', 'CloudSunRain', 'Cloudy', 'Clover', 'Club', 'Code', 'CodeXml', 'Codepen', 'Codesandbox', 'Coffee', 'Cog', 'Coins', 'Columns2', 'Columns3', 'Columns4', 'Combine', 'Command', 'Compass', 'Component', 'Computer', 'ConciergeBell', 'Cone', 'Construction', 'Contact', 'Contact2', 'Container', 'Contrast', 'Cookie', 'CookingPot', 'Copy', 'CopyCheck', 'CopyMinus', 'CopyPlus', 'CopySlash', 'CopyX', 'Copyleft', 'Copyright', 'CornerDownLeft', 'CornerDownRight', 'CornerLeftDown', 'CornerLeftUp', 'CornerRightDown', 'CornerRightUp', 'CornerUpLeft', 'CornerUpRight', 'Cpu', 'CreativeCommons', 'CreditCard', 'Croissant', 'Crop', 'Cross', 'Crosshair', 'Crown', 'Cuboid', 'CupSoda', 'Currency', 'Database', 'DatabaseBackup', 'DatabaseZap', 'Delete', 'Dessert', 'Diameter', 'Diamond', 'Dice1', 'Dice2', 'Dice3', 'Dice4', 'Dice5', 'Dice6', 'Dices', 'Diff', 'Disc', 'Disc2', 'Disc3', 'DiscAlbum', 'Divide', 'Dna', 'DnaOff', 'Dog', 'DollarSign', 'Donut', 'DoorClosed', 'DoorOpen', 'Dot', 'Download', 'DraftingCompass', 'Drama', 'Dribbble', 'Drill', 'Droplet', 'Droplets', 'Drum', 'Drumstick', 'Dumbbell', 'Ear', 'EarOff', 'Eclipse', 'Egg', 'EggFried', 'EggOff', 'Equal', 'EqualNot', 'Eraser', 'Euro', 'Expand', 'ExternalLink', 'Eye', 'EyeOff', 'Facebook', 'Factory', 'Fan', 'FastForward', 'Feather', 'Fence', 'Ferry', 'File', 'FileArchive', 'FileAudio', 'FileAudio2', 'FileAxis3d', 'FileBadge', 'FileBadge2', 'FileBarChart', 'FileBarChart2', 'FileBox', 'FileCheck', 'FileCheck2', 'FileClock', 'FileCode', 'FileCode2', 'FileCog', 'FileCog2', 'FileDiff', 'FileDigit', 'FileDown', 'FileEdit', 'FileHeart', 'FileImage', 'FileImage2', 'FileInput', 'FileJson', 'FileJson2', 'FileKey', 'FileKey2', 'FileLineChart', 'FileLock', 'FileLock2', 'FileMinus', 'FileMinus2', 'FileOutput', 'FileMusic', 'FilePieChart', 'FilePlus', 'FilePlus2', 'FileQuestion', 'FileScan', 'FileSearch', 'FileSearch2', 'FileSliders', 'FileSliders2', 'FileSpreadsheet', 'FileStack', 'FileSymlink', 'FileTerminal', 'FileText', 'FileType', 'FileType2', 'FileUp', 'FileVideo', 'FileVideo2', 'FileVolume', 'FileVolume2', 'FileWarning', 'FileX', 'FileX2', 'Files', 'Film', 'Filter', 'FilterX', 'Fingerprint', 'FireExtinguisher', 'Fish', 'FishOff', 'FishSymbol', 'Flag', 'FlagOff', 'FlagTriangleLeft', 'FlagTriangleRight', 'Flame', 'FlameKindling', 'Flashlight', 'FlashlightOff', 'FlaskConical', 'FlaskConicalOff', 'FlaskRound', 'FlipHorizontal', 'FlipHorizontal2', 'FlipVertical', 'FlipVertical2', 'Flower', 'Flower2', 'Focus', 'FoldHorizontal', 'FoldVertical', 'Folder', 'FolderArchive', 'FolderCheck', 'FolderClock', 'FolderClosed', 'FolderCog', 'FolderCog2', 'FolderDot', 'FolderDown', 'FolderEdit', 'FolderGit', 'FolderGit2', 'FolderHeart', 'FolderInput', 'FolderKanban', 'FolderKey', 'FolderLock', 'FolderMinus', 'FolderOpen', 'FolderOpenDot', 'FolderOutput', 'FolderPlus', 'FolderRoot', 'FolderSearch', 'FolderSearch2', 'FolderSymlink', 'FolderSync', 'FolderTree', 'FolderUp', 'FolderX', 'Folders', 'Footprints', 'Forklift', 'FormInput', 'Forward', 'Frame', 'Framer', 'Frown', 'Fuel', 'Fullscreen', 'FunctionSquare', 'GalleryHorizontal', 'GalleryHorizontalEnd', 'GalleryThumbnails', 'GalleryVertical', 'GalleryVerticalEnd', 'Gamepad', 'Gamepad2', 'GanttChart', 'Gauge', 'Gavel', 'Gem', 'Ghost', 'Gift', 'GitBranch', 'GitBranchPlus', 'GitCommit', 'GitCommitHorizontal', 'GitCompare', 'GitCompareArrows', 'GitFork', 'GitGraph', 'GitMerge', 'GitPullRequest', 'GitPullRequestArrow', 'GitPullRequestClosed', 'GitPullRequestCreate', 'GitPullRequestCreateArrow', 'GitPullRequestDraft', 'Github', 'Gitlab', 'GlassWater', 'Glasses', 'Globe', 'Globe2', 'Goal', 'Grab', 'GraduationCap', 'Grape', 'Grid2x2', 'Grid3x3', 'Grid3x3Check', 'Grid3x3X', 'Grid3x3X', 'Grip', 'GripHorizontal', 'GripVertical', 'Group', 'Hammer', 'Hand', 'HandCoins', 'HandHeart', 'HandHelping', 'HandMetal', 'HandPlatter', 'Handshake', 'HardDrive', 'HardDriveDownload', 'HardDriveUpload', 'HardHat', 'Hash', 'Haze', 'HdmiPort', 'Heading', 'Heading1', 'Heading2', 'Heading3', 'Heading4', 'Heading5', 'Heading6', 'Headphones', 'Headset', 'Heart', 'HeartCrack', 'HeartHandshake', 'HeartOff', 'HeartPulse', 'Heater', 'HelpCircle', 'HelpingHand', 'Hexagon', 'Highlighter', 'History', 'Home', 'Hop', 'HopOff', 'Hospital', 'Hotel', 'Hourglass', 'IceCream', 'IceCream2', 'Image', 'ImageDown', 'ImageMinus', 'ImageOff', 'ImagePlus', 'ImageUp', 'Images', 'Import', 'Inbox', 'Indent', 'IndianRupee', 'Infinity', 'Info', 'Inspect', 'Instagram', 'Italic', 'IterationCcw', 'IterationCw', 'JapaneseYen', 'Joystick', 'Kanban', 'Key', 'KeyRound', 'KeySquare', 'Keyboard', 'KeyboardMusic', 'Lamp', 'LampCeiling', 'LampDesk', 'LampFloor', 'LampWallDown', 'LampWallUp', 'LandPlot', 'Landmark', 'Languages', 'Laptop', 'Laptop2', 'LaptopMinimal', 'LaptopMinimal', 'Lasso', 'LassoSelect', 'Laugh', 'Layers', 'Layers2', 'Layers3', 'LayoutDashboard', 'LayoutGrid', 'LayoutList', 'LayoutPanelLeft', 'LayoutPanelTop', 'LayoutTemplate', 'Leaf', 'LeafyGreen', 'Lectern', 'Legacy', 'Lemon', 'Library', 'LifeBuoy', 'Ligature', 'Lightbulb', 'LightbulbOff', 'LineChart', 'Link', 'Link2', 'Link2Off', 'Linkedin', 'List', 'ListChecks', 'ListEnd', 'ListFilter', 'ListMinus', 'ListMusic', 'ListOrdered', 'ListPlus', 'ListRestart', 'ListStart', 'ListTodo', 'ListTree', 'ListVideo', 'ListX', 'Loader', 'Loader2', 'LoaderCircle', 'Locate', 'LocateFixed', 'LocateOff', 'Lock', 'LockKeyhole', 'LockKeyholeOpen', 'LogIn', 'LogOut', 'Lollipop', 'Luggage', 'M', 'Magnet', 'Mail', 'MailCheck', 'MailMinus', 'MailOpen', 'MailPlus', 'MailQuestion', 'MailSearch', 'MailWarning', 'MailX', 'Mailbox', 'Mails', 'Map', 'MapPin', 'MapPinOff', 'MapPinned', 'Martini', 'Maximize', 'Maximize2', 'Medal', 'Megaphone', 'MegaphoneOff', 'Meh', 'MemoryStick', 'Menu', 'Merge', 'MessageCircle', 'MessageCircleCode', 'MessageCircleDashed', 'MessageCircleHeart', 'MessageCircleMore', 'MessageCircleOff', 'MessageCirclePlus', 'MessageCircleQuestion', 'MessageCircleReply', 'MessageCircleWarning', 'MessageCircleX', 'MessageSquare', 'MessageSquareCode', 'MessageSquareDashed', 'MessageSquareDiff', 'MessageSquareDot', 'MessageSquareHeart', 'MessageSquareMore', 'MessageSquareOff', 'MessageSquarePlus', 'MessageSquareQuote', 'MessageSquareReply', 'MessageSquareShare', 'MessageSquareText', 'MessageSquareWarning', 'MessageSquareX', 'MessagesSquare', 'Mic', 'Mic2', 'MicOff', 'MicVocal', 'Microscope', 'Microwave', 'Milestone', 'Milk', 'MilkOff', 'Minimize', 'Minimize2', 'Minus', 'Monitor', 'MonitorCheck', 'MonitorDot', 'MonitorDown', 'MonitorOff', 'MonitorPause', 'MonitorPlay', 'MonitorSmartphone', 'MonitorSpeaker', 'MonitorStop', 'MonitorUp', 'MonitorX', 'Moon', 'MoonStar', 'MoreHorizontal', 'MoreVertical', 'Mountain', 'MountainSnow', 'Mouse', 'MousePointer', 'MousePointer2', 'MousePointerClick', 'MousePointerSquare', 'MousePointerSquareDashed', 'Move', 'Move3d', 'MoveDiagonal', 'MoveDiagonal2', 'MoveDown', 'MoveDownLeft', 'MoveDownRight', 'MoveHorizontal', 'MoveLeft', 'MoveRight', 'MoveUp', 'MoveUpLeft', 'MoveUpRight', 'MoveVertical', 'Music', 'Music2', 'Music3', 'Music4', 'Navigation', 'Navigation2', 'Navigation2Off', 'NavigationOff', 'Network', 'Newspaper', 'Nfc', 'Notebook', 'NotebookPen', 'NotebookTabs', 'NotebookText', 'NotepadText', 'NotepadTextDashed', 'Nut', 'NutOff', 'Octagon', 'OctagonAlert', 'OctagonPause', 'OctagonX', 'Option', 'Orbit', 'Origami', 'Outdent', 'Package', 'Package2', 'PackageCheck', 'PackageMinus', 'PackageOpen', 'PackagePlus', 'PackageSearch', 'PackageX', 'PaintBucket', 'PaintRoller', 'Paintbrush', 'Paintbrush2', 'Palette', 'Palmtree', 'PanelBottom', 'PanelBottomClose', 'PanelBottomDashed', 'PanelBottomOpen', 'PanelLeft', 'PanelLeftClose', 'PanelLeftDashed', 'PanelLeftOpen', 'PanelRight', 'PanelRightClose', 'PanelRightDashed', 'PanelRightOpen', 'PanelTop', 'PanelTopClose', 'PanelTopDashed', 'PanelTopOpen', 'PanelsLeftRight', 'PanelsTopBottom', 'Paperclip', 'Parentheses', 'Parenthesis', 'ParkingCircle', 'ParkingCircleOff', 'ParkingMeter', 'ParkingSquare', 'ParkingSquareOff', 'PartyPopper', 'Pause', 'PawPrint', 'PcCase', 'Pen', 'PenLine', 'PenTool', 'Pencil', 'PencilLine', 'PencilRuler', 'Pentagon', 'Percent', 'PersonStanding', 'Phone', 'PhoneCall', 'PhoneForwarded', 'PhoneIncoming', 'PhoneMissed', 'PhoneOff', 'PhoneOutgoing', 'Pi', 'Piano', 'Pickaxe', 'PictureInPicture', 'PictureInPicture2', 'PieChart', 'PiggyBank', 'Pilcrow', 'PilcrowLeft', 'PilcrowRight', 'Pill', 'Pin', 'PinOff', 'Pipette', 'Pizza', 'Plane', 'PlaneLanding', 'PlaneTakeoff', 'Play', 'Plug', 'Plug2', 'PlugZap', 'PlugZap2', 'Plus', 'Pocket', 'PocketKnife', 'Podcast', 'Pointer', 'Popcorn', 'Popsicle', 'PoundSterling', 'Power', 'PowerOff', 'Presentation', 'Printer', 'Projector', 'Proportions', 'Puzzle', 'Pyramid', 'QrCode', 'Quote', 'Rabbit', 'Radar', 'Radiation', 'Radio', 'RadioReceiver', 'RadioTower', 'Radius', 'RailSymbol', 'Rainbow', 'Rat', 'Ratio', 'Receipt', 'ReceiptCent', 'ReceiptEuro', 'ReceiptIndianRupee', 'ReceiptJapaneseYen', 'ReceiptPoundSterling', 'ReceiptRussianRuble', 'ReceiptSwissFranc', 'ReceiptText', 'RectangleEllipsis', 'RectangleHorizontal', 'RectangleVertical', 'Recycle', 'Redo', 'Redo2', 'RedoDot', 'RefreshCcw', 'RefreshCcwDot', 'RefreshCw', 'RefreshCwOff', 'Refrigerator', 'Regex', 'RemoveFormatting', 'Repeat', 'Repeat1', 'Repeat2', 'Replace', 'ReplaceAll', 'Reply', 'ReplyAll', 'Rewind', 'Ribbon', 'Rocket', 'RockingChair', 'RollerCoaster', 'Rotate3d', 'RotateCcw', 'RotateCcwSquare', 'RotateCw', 'RotateCwSquare', 'Route', 'RouteOff', 'Router', 'Rows2', 'Rows3', 'Rows4', 'Rss', 'Ruler', 'RussianRuble', 'Sailboat', 'Salad', 'Sandwich', 'Satellite', 'SatelliteDish', 'Save', 'SaveAll', 'Scale', 'Scale3d', 'Scaling', 'Scan', 'ScanBarcode', 'ScanEye', 'ScanFace', 'ScanLine', 'ScanSearch', 'ScanText', 'ScatterChart', 'School', 'School2', 'Scissors', 'ScissorsLineDashed', 'ScreenShare', 'ScreenShareOff', 'Scroll', 'ScrollText', 'Search', 'SearchCheck', 'SearchCode', 'SearchSlash', 'SearchX', 'Send', 'SendHorizontal', 'SendToBack', 'SeparatorHorizontal', 'SeparatorVertical', 'Server', 'ServerCog', 'ServerCrash', 'ServerOff', 'Settings', 'Settings2', 'Shapes', 'Share', 'Share2', 'Sheet', 'Shell', 'Shield', 'ShieldAlert', 'ShieldBan', 'ShieldCheck', 'ShieldEllipsis', 'ShieldHalf', 'ShieldHelp', 'ShieldMinus', 'ShieldOff', 'ShieldPlus', 'ShieldQuestion', 'ShieldX', 'Ship', 'ShipWheel', 'Shirt', 'ShoppingBag', 'ShoppingBasket', 'ShoppingCart', 'Shovel', 'ShowerHead', 'Shrink', 'Shrub', 'Shuffle', 'Sigma', 'Signal', 'SignalHigh', 'SignalLow', 'SignalMedium', 'SignalZero', 'Signpost', 'SignpostBig', 'Siren', 'SkipBack', 'SkipForward', 'Skull', 'Slack', 'Slash', 'Slice', 'Sliders', 'SlidersHorizontal', 'Smartphone', 'SmartphoneCharging', 'SmartphoneNfc', 'Smile', 'SmilePlus', 'Smiley', 'Snowflake', 'Sofa', 'Soup', 'Space', 'Spade', 'Sparkle', 'Sparkles', 'Speaker', 'Speech', 'SpellCheck', 'SpellCheck2', 'Spline', 'Split', 'SplitSquareHorizontal', 'SplitSquareVertical', 'Sprout', 'Square', 'SquareArrowDown', 'SquareArrowDownLeft', 'SquareArrowDownRight', 'SquareArrowLeft', 'SquareArrowOutDownLeft', 'SquareArrowOutDownRight', 'SquareArrowOutUpLeft', 'SquareArrowOutUpRight', 'SquareArrowRight', 'SquareArrowUp', 'SquareArrowUpLeft', 'SquareArrowUpRight', 'SquareCode', 'SquareDashedBottom', 'SquareDashedBottomCode', 'SquareDot', 'SquareEqual', 'SquareGanttChart', 'SquareKanban', 'SquareLibrary', 'SquareM', 'SquareMenu', 'SquareMinus', 'SquareMousePointer', 'SquareParking', 'SquareParkingOff', 'SquarePen', 'SquarePercent', 'SquarePi', 'SquarePilcrow', 'SquarePlay', 'SquarePlus', 'SquarePower', 'SquareRadical', 'SquareSigma', 'SquareSlash', 'SquareSplitHorizontal', 'SquareSplitVertical', 'SquareStack', 'SquareTerminal', 'SquareUser', 'SquareUserRound', 'SquareX', 'Squircle', 'Squirrel', 'Stamp', 'Star', 'StarHalf', 'StarOff', 'StepBack', 'StepForward', 'Stethoscope', 'Sticker', 'StickyNote', 'StopCircle', 'Store', 'StretchHorizontal', 'StretchVertical', 'Strikethrough', 'Subscript', 'Subtitles', 'Sun', 'SunDim', 'SunMedium', 'SunMoon', 'SunSnow', 'SunUp', 'Sunrise', 'Sunset', 'Superscript', 'SwissFranc', 'SwitchCamera', 'Sword', 'Swords', 'Syringe', 'Table', 'Table2', 'TableProperties', 'Tablet', 'TabletSmartphone', 'Tablets', 'Tag', 'Tags', 'Tally1', 'Tally2', 'Tally3', 'Tally4', 'Tally5', 'Tangent', 'Target', 'Telescope', 'Tent', 'TentTree', 'Terminal', 'TestTube', 'TestTube2', 'TestTubes', 'Text', 'TextCursor', 'TextCursorInput', 'TextQuote', 'TextSelect', 'Theater', 'Thermometer', 'ThermometerSnowflake', 'ThermometerSun', 'ThumbsDown', 'ThumbsUp', 'Ticket', 'TicketCheck', 'TicketMinus', 'TicketPercent', 'TicketPlus', 'TicketSlash', 'TicketX', 'Timer', 'TimerOff', 'TimerReset', 'ToggleLeft', 'ToggleRight', 'Tornado', 'Torpedo', 'Touchpad', 'TouchpadOff', 'TowerControl', 'ToyBrick', 'Tractor', 'TrafficCone', 'TrainFront', 'TrainFrontTunnel', 'TrainTrack', 'TramFront', 'Trash', 'Trash2', 'TreeDeciduous', 'TreePine', 'Trees', 'Trello', 'TrendingDown', 'TrendingUp', 'Triangle', 'TriangleAlert', 'TriangleRight', 'Trophy', 'Truck', 'Turtle', 'Tv', 'Tv2', 'Twitch', 'Twitter', 'Type', 'Umbrella', 'UmbrellaOff', 'Underline', 'Undo', 'Undo2', 'UndoDot', 'UnfoldHorizontal', 'UnfoldVertical', 'Ungroup', 'University', 'Unlink', 'Unlink2', 'Unlock', 'UnlockKeyhole', 'Unplug', 'Upload', 'Usb', 'User', 'UserCheck', 'UserCog', 'UserMinus', 'UserPlus', 'UserRound', 'UserRoundCheck', 'UserRoundCog', 'UserRoundMinus', 'UserRoundPlus', 'UserRoundSearch', 'UserRoundX', 'UserSearch', 'UserX', 'Users', 'UsersRound', 'Utensils', 'UtensilsCrossed', 'UtilityPole', 'Variable', 'Vault', 'Vegan', 'VenetianMask', 'Vibrate', 'VibrateOff', 'Video', 'VideoOff', 'Videotape', 'View', 'Voicemail', 'Volume', 'Volume1', 'Volume2', 'VolumeX', 'Vote', 'Wallet', 'Wallet2', 'WalletCards', 'Wallpaper', 'Wand', 'Wand2', 'WandSparkles', 'Warehouse', 'Watch', 'Waves', 'Webcam', 'Webhook', 'WebhookOff', 'Weight', 'Wheat', 'WheatOff', 'WholeWord', 'Wifi', 'WifiOff', 'Wind', 'Wine', 'WineOff', 'Workflow', 'Wrench', 'X', 'Youtube', 'Zap', 'ZapOff', 'ZoomIn', 'ZoomOut',
]);

/**
 * Scans the generated code for Lucide icon components and adds the necessary import statement.
 * This is a robust fallback in case the AI model forgets to include the imports.
 * @param code The generated code string.
 * @returns Code with the lucide-react import statement added if necessary.
 */
function addLucideImports(code: string): string {
    const usedIcons = new Set<string>();

    allLucideIcons.forEach(icon => {
        const iconRegex = new RegExp(`<${icon}(\\s|\\/>|>)`);
        if (iconRegex.test(code)) {
            usedIcons.add(icon);
        }
    });

    if (usedIcons.size === 0) {
        return code;
    }

    const sortedIcons = Array.from(usedIcons).sort();
    const importStatement = `import { ${sortedIcons.join(', ')} } from 'lucide-react';`;

    // Remove any pre-existing lucide-react imports to prevent duplicates.
    let codeWithoutLucide = code.replace(/import\\s+\\{.*\\}\\s+from\\s+['"]lucide-react['"];?/g, '').trim();

    // Add the new import statement at the top.
    return `${importStatement}\n${codeWithoutLucide}`;
}


// --- OPENROUTER HANDLER ---
async function generateWithOpenRouter(
    modelName: string,
    systemInstruction: string,
    userPrompt: string,
    imageBase64?: string
): Promise<{ text: string }> {
    
    // Map internal names to OpenRouter IDs
    let openRouterModel = modelName;
    if (modelName === 'mimo-v2-flash') {
        openRouterModel = 'xiaomi/mimo-v2-flash:free';
    } else if (modelName === 'z-ai/glm-4.5-air') {
        openRouterModel = 'z-ai/glm-4.5-air:free';
    } else if (modelName === 'devetral') {
        openRouterModel = 'mistralai/devstral-2512:free';
    } else if (modelName === 'qwen-vl-7b') {
        openRouterModel = 'qwen/qwen-2.5-vl-7b-instruct:free';
    }

    try {
        console.log(`Attempting generation with OpenRouter model: ${openRouterModel}`);

        const messages: any[] = [
             { role: "system", content: systemInstruction }
        ];

        if (imageBase64) {
             messages.push({
                role: "user",
                content: [
                    { type: "text", text: userPrompt },
                    { type: "image_url", image_url: { url: imageBase64 } }
                ]
             });
        } else {
             messages.push({ role: "user", content: userPrompt });
        }
        
        const body: any = {
            model: openRouterModel,
            messages: messages,
            temperature: 0.7, 
            top_p: 0.9
        };

        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": SITE_URL,
                "X-Title": SITE_NAME,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`OpenRouter Error (${openRouterModel}): ${response.status} - ${errData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const message = data.choices?.[0]?.message;
        const content = message?.content;
        
        if (!content || content.trim() === "") {
             console.error("Empty or invalid content received from OpenRouter:", data);
             throw new Error("Received empty or invalid response from AI provider.");
        }

        return { text: content };

    } catch (error: any) {
        console.error(`Failed with OpenRouter ${openRouterModel}:`, error);
        throw error;
    }
}

export const generateWebsitePlan = async (userPrompt: string, modelName: string = 'gemini-3-pro-preview'): Promise<string> => {
    const systemInstruction = `You are a technical architect. Create a build plan with sections, color scheme (Tailwind), and features. Max 150 words.`;

    if (modelName === 'mimo-v2-flash' || modelName === 'z-ai/glm-4.5-air' || modelName === 'devetral' || modelName === 'qwen-vl-7b') {
        const result = await generateWithOpenRouter(modelName, systemInstruction, userPrompt);
        return result.text;
    }

    try {
        const client = getAiInstance();
        const response = await generateWithRetry(client, modelName, {
            contents: `USER REQUEST: "${userPrompt}"\n\nCreate a build plan.`,
            config: { systemInstruction, temperature: 0.7 }
        });
        return response.text || "Could not generate a plan.";
    } catch (error: any) {
         if (modelName === 'gemini-3-pro-preview') return generateWebsitePlan(userPrompt, 'gemini-3-flash-preview');
         throw error;
    }
};

export const generateWebsiteCode = async (
    userPrompt: string, 
    currentCode?: string, 
    approvedPlan?: string,
    imageBase64?: string,
    modelName: string = 'gemini-3-pro-preview',
    mode: 'website' | 'ui' = 'website'
): Promise<{ code: string, reasoning?: string }> => {
  
  let taskInstruction = "";
  if (mode === 'ui') {
      taskInstruction = `
        **TASK: CREATE UI COMPONENT**
        Create a single, beautiful, modern React component based on the user's request.
        - Center the component on the screen using 'min-h-screen flex items-center justify-center bg-gray-100 p-4'.
        - Use modern Tailwind classes (shadow-xl, rounded-2xl, backdrop-blur, ring-1 ring-black/5, etc.).
        - Do NOT build a whole website with Navbar/Footer unless specifically asked.
        - Focus on aesthetics, gradients, and micro-interactions.
        - EXPORT DEFAULT the main component.
      `;
  } else {
      taskInstruction = `
        **TASK: CREATE FULL WEBSITE**
        Build a stunning, complete website section or page.
        - Use a modern layout.
        - Ensure responsive design (mobile-first).
        - EXPORT DEFAULT the main App component.
      `;
  }

  let systemInstruction = `
      You are a friendly and helpful AI chatbot that specializes in React development. Your goal is to assist users in building their websites and UI components.
      
      ${taskInstruction}

      **INTERACTION STYLE:**
      - Be conversational and encouraging.
      - If the user asks for a change, acknowledge their request and explain what you're doing.
      - If you're generating a new component, start with a friendly message like, "Here is the code for the component you requested. I hope you like it!"

      **CRITICAL SYNTAX RULES:**
      1. **PERFECT SYNTAX:** You MUST generate syntactically correct, complete JSX code. Pay obsessive attention to detail, ensuring all tags are properly closed, brackets are matched, and commas are placed correctly. Double-check for syntax errors before responding.
      2. **DOUBLE QUOTES ONLY:** You MUST use double quotes (") for all strings in JSX.
      3. **NO TRUNCATION:** You MUST provide the FULL code. No "// ... rest of code".
      4. **IMPORTS:**
         - Import React hooks like: \`import React, { useState, useEffect } from 'react';\`
         - **CRITICAL:** If you use ANY icon component (e.g., \`<Coffee />\`, \`<User />\`), you MUST import it from \`lucide-react\`. For example: \`import { Leaf, Award, Truck, Coffee, User, ShoppingCart, Menu, X, ArrowRight, Star, Facebook, Instagram, Twitter } from 'lucide-react';\`
         - DO NOT import 'framer-motion'.
      5. **NO MARKDOWN COMMENTS IN CODE:** Do not put \`> \` or other markdown artifacts at the start of lines.
      6. **MULTI-PAGE NAVIGATION:**
         - To create a multi-page site, manage the current page with a state variable: \`const [page, setPage] = useState('home');\`
         - Render content conditionally based on this state: \`{page === 'home' && <HomePage />}\`
         - Navigation links MUST use \`onClick={() => setPage('contact')}\` instead of \`href\`.
         - The main App component should contain the router logic and render the appropriate page component.

      **FORMAT:** Return only the code inside \`\`\`tsx\`\`\` blocks.
    `;

    let finalPrompt = "";

    if (currentCode) {
      systemInstruction += `
        **TASK: UPDATE/FIX CODE**
        Modify the provided code according to user request. 
        REWRITE THE ENTIRE FILE from imports to export.
        Ensure syntax is perfect (matched brackets, commas).
      `;

      finalPrompt = `
        CURRENT CODE:
        ${currentCode}

        USER REQUEST: "${userPrompt}"
        
        Provide the complete updated file now.
      `;
    } else {
      if (approvedPlan) systemInstruction += `\n**PLAN TO FOLLOW:**\n${approvedPlan}`;
      finalPrompt = `USER PROMPT: "${userPrompt}"`;
    }

    let rawResponse = "";
    // Gemma models generally do not support hidden reasoning/thinking chains in this API context.
    const reasoning = undefined; 

    // Handle OpenRouter Models
    if (modelName === 'mimo-v2-flash' || modelName === 'z-ai/glm-4.5-air' || modelName === 'devetral' || modelName === 'qwen-vl-7b') {
        const result = await generateWithOpenRouter(modelName, systemInstruction, finalPrompt, imageBase64);
        rawResponse = result.text;
    } else {
        // Official Google Gemini
        try {
            const client = getAiInstance();
            let contents: any[] = [];
            if (imageBase64) {
                const base64Data = imageBase64.split(',')[1] || imageBase64;
                contents.push({ inlineData: { mimeType: "image/png", data: base64Data } });
                finalPrompt = `(User attached image). ${finalPrompt}`;
            }
            contents.push({ text: finalPrompt });

            try {
                const response = await generateWithRetry(client, modelName, { contents, config: { systemInstruction, temperature: 0.7 } });
                rawResponse = response.text || "";
            } catch (error: any) {
                // Fallback for Pro preview to Flash if it fails
                if (modelName === 'gemini-3-pro-preview') {
                    console.warn("Gemini Pro failed, falling back to Flash");
                    const fallbackResponse = await generateWithRetry(client, 'gemini-3-flash-preview', { contents, config: { systemInstruction, temperature: 0.7 } });
                    rawResponse = fallbackResponse.text || "";
                } else {
                    throw error;
                }
            }
        } catch (error: any) {
            throw new Error(error.message || "Failed to generate code.");
        }
    }

    const rawCode = extractCodeBlock(rawResponse);
    const fixedSyntaxCode = autoFixCodeErrors(rawCode);
    const code = addLucideImports(fixedSyntaxCode);

    return { code, reasoning };
};

/**
 * Attempts to programmatically fix common, simple syntax errors generated by AI models.
 * This acts as a pre-filter before sending the code to the preview component.
 * @param code The raw code string.
 * @returns Code with attempted fixes.
 */
const autoFixCodeErrors = (code: string): string => {
    let fixedCode = code;

    // Fix 1: Unterminated string constants in JSX attributes.
    // This regex finds attributes (e.g., className="text-white) that end a line with an unclosed quote and closes it.
    fixedCode = fixedCode.replace(/(\w+\s*=\s*)"([^"]*)$/gm, '$1"$2"');

    // Fix 2: Remove lines with common hallucinated undefined variables like 'Discord'.
    const commonHallucinations = ['Discord'];
    commonHallucinations.forEach(variable => {
        const regex = new RegExp(`^.*\\b${variable}\\b.*$`, 'gm');
        fixedCode = fixedCode.replace(regex, '');
    });

    return fixedCode;
};