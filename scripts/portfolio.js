/* =========================================================================
   Portfolio Studio — unified renderer + editor
   - Fetches/Saves content.json via /api/content
   - Renders each category using a type-specific template (multi-lang aware)
   - Sidebar drives: language, theme, theme-customizer, orientation,
     category list (reorder/add/delete), and per-section edit form
   - Any change to content or controls re-renders the preview live
   ========================================================================= */
(() => {

  // ============================================================== STATE
  const state = {
    content: null,
    originalSig: '',
    selectedId: null,
    lang: 'vi',
    theme: 'editorial',
    orientation: 'landscape',
    images: [],                  // [{name, size, mtime}]
    pickerContext: null,         // { set: fn(filename), multi: bool }
    themeOverrides: {},          // { [theme]: { '--accent': '#...', --font-body: 'Inter', ... } }
    customFonts: [],             // [{name, family, url}] (server-hosted)
    googleFonts: [],             // ['Merriweather', ...] loaded via meta
    isStatic: false,             // true if /api/content not reachable
    themeDefaults: {},           // { [theme]: { '--accent': '#...', --font-body: '...' } } captured from CSS
  };

  const LANGS = ['vi', 'en', 'zh'];

  // ============================================================== UI i18n
  // Every fixed/display string in the Studio chrome lives here, keyed by id.
  // Dynamic CV content still comes from content.json via t().
  const UI = {
    vi: {
      // Rail tooltips
      'rail.brand':             'Portfolio Studio — Lâm Thanh Tiệp',
      'rail.lang':              'Ngôn ngữ',
      'rail.style':             'Chủ đề & Kiểu chữ',
      'rail.orient':            'Hướng in',
      'rail.orient.landscape':  'Ngang (bấm để chuyển sang dọc)',
      'rail.orient.portrait':   'Dọc (bấm để chuyển sang ngang)',
      'rail.save':              'Lưu (⌘S)',
      'rail.print':             'In / Lưu PDF',
      'toolbar.theme':          'Chủ đề',
      'toolbar.save':           'Lưu',
      'status.tooltip':         'Trạng thái lưu',
      'status.dirty':           'Chưa lưu — ⌘S để lưu',
      'status.saved':           'Đã lưu toàn bộ',
      'status.static':          'Chế độ tĩnh (chỉ đọc)',
      // Sidebar
      'sidebar.subtitle':       'Lâm Thanh Tiệp',
      'sidebar.add':            '+ Thêm',
      'sidebar.add.title':      'Thêm mục mới',
      'sidebar.heading.sections': 'Các mục',
      'sidebar.heading.edit':   'Chỉnh sửa mục',
      'sidebar.footer':         'Trình soạn chạy trên máy chủ. Nội dung được lưu trong <code>content.json</code>.',
      'editor.empty':           'Chọn một mục ở trên để chỉnh sửa. Xem trước cập nhật tức thì.',
      'editor.noEditor':        'Không có trình soạn cho kiểu "{type}".',
      'editor.id':              'ID',
      'editor.danger':          'Xoá mục này',
      'editor.delete':          'Xoá',
      // Popovers / modal chrome
      'pop.lang.title':         'Ngôn ngữ',
      'style.title':            'Chủ đề & Kiểu chữ',
      'style.resetAll':         'Đặt lại chủ đề',
      'style.resetAll.title':   'Đặt lại toàn bộ màu và phông cho chủ đề này',
      'style.close':            'Đóng',
      'style.section.preset':   'Chủ đề mẫu',
      'style.section.colors':   'Màu sắc',
      'style.section.fonts':    'Kiểu chữ',
      'style.resetColors':      'Đặt lại màu',
      'style.resetFonts':       'Đặt lại phông',
      'style.reset.title':      'Đặt lại về mặc định của chủ đề',
      'style.customFonts':      'Phông tuỳ chỉnh',
      'style.uploadFont':       '+ Tải phông lên',
      'style.familyPlaceholder':'Tên họ phông (vd: My Display)',
      'style.uploadHint':       'Tải .woff2, .woff, .ttf hoặc .otf. Đặt tên họ phông để chọn trong danh sách ở trên.',
      'style.loadGoogle':       'Tải một Google Font',
      'style.familyLabel':      'Tên họ phông',
      'style.googlePlaceholder':'vd: Merriweather',
      'style.loadFontBtn':      'Tải phông',
      'style.browseGoogle':     'Duyệt Google Fonts ↗',
      'style.browseGoogle.title':'Mở fonts.google.com trong tab mới để chọn phông phù hợp, rồi dán tên họ phông vào ô bên trên',
      'style.loadGoogleHint':   'Nhập tên bất kỳ họ phông Google. Nó sẽ được thêm vào các danh sách phông ở trên.',
      'style.noCustomFonts':    'Chưa có phông tuỳ chỉnh.',
      'style.font.display':     'Tiêu đề',
      'style.font.body':        'Nội dung',
      'style.font.script':      'Chữ viết',
      'style.font.hint.display':'Tiêu đề & heading',
      'style.font.hint.body':   'Đoạn văn',
      'style.font.hint.script': 'Điểm nhấn cursive',
      'style.color.accent':     'Màu nhấn',
      'style.color.heading':    'Tiêu đề',
      'style.color.page-bg':    'Nền trang',
      'style.color.page-fg':    'Chữ nội dung',
      'style.color.fg-muted':   'Chữ phụ',
      'style.color.surface-2':  'Bề mặt',
      'picker.title':           'Chọn ảnh',
      'picker.upload':          '+ Tải lên',
      'picker.close':           'Đóng',
      'picker.empty':           'Chưa có ảnh. Tải lên để bắt đầu.',
      'picker.confirmDelete':   'Xoá "{name}"?',
      'loading':                'Đang tải portfolio…',
      'field.placeholder.color':'#RRGGBB',
      'field.placeholder.img':  'images/…',
      'field.placeholder.url':  'https://…',
      'action.chooseImage':     'Chọn ảnh',
      'action.add':             '+ Thêm',
      'action.remove':          'Xoá',
      'action.noImage':         'chưa có ảnh',
      // Field labels (editor)
      'field.stageName':        'Nghệ danh',
      'field.realName':         'Tên thật',
      'field.portfolioLabel':   'Nhãn portfolio',
      'field.displayName':      'Tên hiển thị',
      'field.coverImage':       'Ảnh bìa',
      'field.role':             'Vai trò',
      'field.heading':          'Tiêu đề',
      'field.subheading':       'Phụ đề',
      'field.body':             'Nội dung',
      'field.image':            'Ảnh',
      'field.photo':            'Ảnh',
      'field.heroImage':        'Ảnh nền',
      'field.title':            'Tiêu đề',
      'field.institution':      'Nơi đào tạo',
      'field.skillName':        'Kỹ năng',
      'field.percent':          'Phần trăm',
      'field.intro':            'Giới thiệu',
      'field.playName':         'Tên vở',
      'field.showName':         'Tên chương trình',
      'field.work':             'Tác phẩm',
      'field.categoryTitle':    'Tên danh mục',
      'field.iconEmoji':        'Biểu tượng (emoji)',
      'field.iconType':         'Biểu tượng (phone / email / facebook / tiktok / instagram / youtube)',
      'field.label':            'Nhãn',
      'field.value':            'Giá trị',
      'field.linkHref':         'Liên kết (href)',
      'field.play':             'Vở diễn',
      'field.poster':           'Poster',
      // Card titles
      'card.artist':            'Nghệ sĩ',
      'card.cover':             'Trang bìa',
      'card.about':             'Giới thiệu',
      'card.personal':          'Thông tin cá nhân',
      'card.training':          'Đào tạo',
      'card.abilities':         'Kỹ năng',
      'card.theatre':           'Kho ảnh sân khấu',
      'card.tvDramas':          'Phim truyền hình',
      'card.film':              'Điện ảnh',
      'card.press':             'Báo chí & Truyền thông',
      'card.contact':           'Liên hệ',
      'card.thankyou':          'Cảm ơn',
      'card.roles':             'Các vai',
      'card.sections':          'Các phần',
      'card.programs':          'Chương trình',
      'card.skills':            'Kỹ năng',
      'card.plays':             'Các vở',
      'card.shows':             'Chương trình',
      'card.categories':        'Danh mục',
      'card.works':             'Tác phẩm',
      'card.mentions':          'Bài đăng',
      'card.entries':           'Mục',
      'card.fields':            'Trường',
      'card.photos':            'Ảnh',
      'card.trainingPhotos':    'Ảnh đào tạo',
      'card.tvPhotos':           'Ảnh phim truyền hình',
      'card.filmStills':        'Ảnh phim điện ảnh',
      'card.bodyPhotos':        'Ảnh hình thể',
      'card.links':             'Liên kết',
      // Section types (the small label next to each section in the sidebar)
      'type.cover':                 'Trang bìa',
      'type.about':                 'Giới thiệu',
      'type.personal-info':         'Thông tin cá nhân',
      'type.body-info':             'Thông tin hình thể',
      'type.training':              'Đào tạo',
      'type.abilities':             'Kỹ năng',
      'type.experiences-gallery':   'Sân khấu',
      'type.experiences-tv':        'Truyền hình',
      'type.film-categories':       'Điện ảnh',
      'type.media':                 'Truyền thông',
      'type.contact':               'Liên hệ',
      'type.thankyou':              'Cảm ơn',
      // Prompts & confirms
      'prompt.sectionType':     'Kiểu mục?\n(cover, about, personal-info, body-info, training, abilities, experiences-gallery, experiences-tv, film-categories, media, contact, thankyou)',
      'prompt.sectionId':       'ID mục?',
      'confirm.deleteSection':  'Xoá mục "{id}"?',
      'confirm.deleteFont':     'Xoá phông "{family}"?',
      // Toasts
      'toast.themeReset':       'Đã đặt lại chủ đề',
      'toast.colorsReset':      'Đã đặt lại màu',
      'toast.fontsReset':       'Đã đặt lại phông',
      'toast.fontLoaded':       'Đã tải "{family}"',
      'toast.fontEnterName':    'Nhập tên họ phông',
      'toast.fontUploaded':     'Đã tải lên {count} phông',
      'toast.fontRemoved':      'Đã xoá phông',
      'toast.imagesUploaded':   'Đã tải lên {count} ảnh',
      'toast.uploadFailed':     'Tải lên thất bại: {msg}',
      'toast.savedDisk':        'Đã lưu xuống đĩa',
      'toast.saveFailed':       'Lưu thất bại: {msg}',
      'toast.saveStatic':       'Chạy node server.js để lưu chỉnh sửa',
      'toast.idInUse':          'ID đã được sử dụng',
      'toast.unknownType':      'Kiểu không xác định: {type}',
      'error.staticFallback':   'Không tải được content.json — chạy Node server (<code>node server.js</code>) từ thư mục này.',
    },
    en: {
      'rail.brand':             'Portfolio Studio — Lâm Thanh Tiệp',
      'rail.lang':              'Language',
      'rail.style':             'Theme & Typography',
      'rail.orient':            'Print orientation',
      'rail.orient.landscape':  'Landscape (click to switch to portrait)',
      'rail.orient.portrait':   'Portrait (click to switch to landscape)',
      'rail.save':              'Save (⌘S)',
      'rail.print':             'Print / Save as PDF',
      'toolbar.theme':          'Theme',
      'toolbar.save':           'Save',
      'status.tooltip':         'Save status',
      'status.dirty':           'Unsaved changes — ⌘S to save',
      'status.saved':           'All changes saved',
      'status.static':          'Static mode (read-only)',
      'sidebar.subtitle':       'Lâm Thanh Tiệp',
      'sidebar.add':            '+ Add',
      'sidebar.add.title':      'Add new section',
      'sidebar.heading.sections': 'Sections',
      'sidebar.heading.edit':   'Edit section',
      'sidebar.footer':         'Server-backed editor. Content is stored in <code>content.json</code>.',
      'editor.empty':           'Pick a section above to edit its content. Changes preview live.',
      'editor.noEditor':        'No editor for type "{type}".',
      'editor.id':              'ID',
      'editor.danger':          'Delete this section',
      'editor.delete':          'Delete',
      'pop.lang.title':         'Language',
      'style.title':            'Theme & Typography',
      'style.resetAll':         'Reset theme',
      'style.resetAll.title':   'Reset all colors & fonts for this theme',
      'style.close':            'Close',
      'style.section.preset':   'Theme preset',
      'style.section.colors':   'Colors',
      'style.section.fonts':    'Typography',
      'style.resetColors':      'Reset colors',
      'style.resetFonts':       'Reset fonts',
      'style.reset.title':      'Reset to theme default',
      'style.customFonts':      'Custom fonts',
      'style.uploadFont':       '+ Upload font',
      'style.familyPlaceholder':'Family name (e.g. My Display)',
      'style.uploadHint':       'Upload .woff2, .woff, .ttf or .otf. Give it a family name so you can pick it from the dropdown above.',
      'style.loadGoogle':       'Load a Google Font',
      'style.familyLabel':      'Family name',
      'style.googlePlaceholder':'e.g. Merriweather',
      'style.loadFontBtn':      'Load font',
      'style.browseGoogle':     'Browse Google Fonts ↗',
      'style.browseGoogle.title':'Open fonts.google.com in a new tab to preview and pick a font, then paste its family name above',
      'style.loadGoogleHint':   "Type any Google Fonts family. It's added to the Typography dropdowns above.",
      'style.noCustomFonts':    'No custom fonts yet.',
      'style.font.display':     'Display',
      'style.font.body':        'Body',
      'style.font.script':      'Script',
      'style.font.hint.display':'Headings & titles',
      'style.font.hint.body':   'Paragraphs',
      'style.font.hint.script': 'Cursive accent',
      'style.color.accent':     'Accent',
      'style.color.heading':    'Heading',
      'style.color.page-bg':    'Page BG',
      'style.color.page-fg':    'Body text',
      'style.color.fg-muted':   'Muted text',
      'style.color.surface-2':  'Surface',
      'picker.title':           'Choose an image',
      'picker.upload':          '+ Upload',
      'picker.close':           'Close',
      'picker.empty':           'No images yet. Upload some to begin.',
      'picker.confirmDelete':   'Delete "{name}"?',
      'loading':                'Loading portfolio…',
      'field.placeholder.color':'#RRGGBB',
      'field.placeholder.img':  'images/…',
      'field.placeholder.url':  'https://…',
      'action.chooseImage':     'Choose image',
      'action.add':             '+ add',
      'action.remove':          'Remove',
      'action.noImage':         'no image',
      'field.stageName':        'Stage name',
      'field.realName':         'Real name',
      'field.portfolioLabel':   'Portfolio label',
      'field.displayName':      'Display name',
      'field.coverImage':       'Cover image',
      'field.role':             'Role',
      'field.heading':          'Heading',
      'field.subheading':       'Subheading',
      'field.body':             'Body',
      'field.image':            'Image',
      'field.photo':            'Photo',
      'field.heroImage':        'Hero image',
      'field.title':            'Title',
      'field.institution':      'Institution',
      'field.skillName':        'Skill name',
      'field.percent':          'Percent',
      'field.intro':            'Intro',
      'field.playName':         'Play name',
      'field.showName':         'Show name',
      'field.work':             'Work',
      'field.categoryTitle':    'Category title',
      'field.iconEmoji':        'Icon (emoji)',
      'field.iconType':         'Icon (phone / email / facebook / tiktok / instagram / youtube)',
      'field.label':            'Label',
      'field.value':            'Value',
      'field.linkHref':         'Link (href)',
      'field.play':             'Play',
      'field.poster':           'Poster',
      'card.artist':            'Artist',
      'card.cover':             'Cover',
      'card.about':             'About',
      'card.personal':          'Personal',
      'card.training':          'Training',
      'card.abilities':         'Abilities',
      'card.theatre':           'Theatre gallery',
      'card.tvDramas':          'TV dramas',
      'card.film':              'Film',
      'card.press':             'Press & Media',
      'card.contact':           'Contact',
      'card.thankyou':          'Thank you',
      'card.roles':             'Roles',
      'card.sections':          'Sections',
      'card.programs':          'Programs',
      'card.skills':            'Skills',
      'card.plays':             'Plays',
      'card.shows':             'Shows',
      'card.categories':        'Categories',
      'card.works':             'Works',
      'card.mentions':          'Mentions',
      'card.entries':           'Entries',
      'card.fields':            'Fields',
      'card.photos':            'Photos',
      'card.trainingPhotos':    'Training photos',
      'card.tvPhotos':          'TV photos',
      'card.filmStills':        'Film stills',
      'card.bodyPhotos':        'Body photos',
      'card.links':             'Links',
      'type.cover':                 'Cover',
      'type.about':                 'About',
      'type.personal-info':         'Personal info',
      'type.body-info':             'Body info',
      'type.training':              'Training',
      'type.abilities':             'Abilities',
      'type.experiences-gallery':   'Theatre',
      'type.experiences-tv':        'Television',
      'type.film-categories':       'Film',
      'type.media':                 'Press',
      'type.contact':               'Contact',
      'type.thankyou':              'Thank you',
      'prompt.sectionType':     'Section type?\n(cover, about, personal-info, body-info, training, abilities, experiences-gallery, experiences-tv, film-categories, media, contact, thankyou)',
      'prompt.sectionId':       'Section id?',
      'confirm.deleteSection':  'Delete section "{id}"?',
      'confirm.deleteFont':     'Delete font "{family}"?',
      'toast.themeReset':       'Theme reset',
      'toast.colorsReset':      'Colors reset',
      'toast.fontsReset':       'Fonts reset',
      'toast.fontLoaded':       'Loaded "{family}"',
      'toast.fontEnterName':    'Enter a font family name',
      'toast.fontUploaded':     'Uploaded {count} font(s)',
      'toast.fontRemoved':      'Font removed',
      'toast.imagesUploaded':   'Uploaded {count} image(s)',
      'toast.uploadFailed':     'Upload failed: {msg}',
      'toast.savedDisk':        'Saved to disk',
      'toast.saveFailed':       'Save failed: {msg}',
      'toast.saveStatic':       'Run node server.js to save edits',
      'toast.idInUse':          'ID already in use',
      'toast.unknownType':      'Unknown type: {type}',
      'error.staticFallback':   'Could not load content.json — run the Node server (<code>node server.js</code>) from this folder.',
    },
    zh: {
      'rail.brand':             'Portfolio Studio — Lâm Thanh Tiệp',
      'rail.lang':              '语言',
      'rail.style':             '主题与字体',
      'rail.orient':            '打印方向',
      'rail.orient.landscape':  '横向（点击切换为纵向）',
      'rail.orient.portrait':   '纵向（点击切换为横向）',
      'rail.save':              '保存 (⌘S)',
      'rail.print':             '打印 / 保存为 PDF',
      'toolbar.theme':          '主题',
      'toolbar.save':           '保存',
      'status.tooltip':         '保存状态',
      'status.dirty':           '有未保存更改 — ⌘S 保存',
      'status.saved':           '全部更改已保存',
      'status.static':          '静态模式（只读）',
      'sidebar.subtitle':       'Lâm Thanh Tiệp',
      'sidebar.add':            '+ 添加',
      'sidebar.add.title':      '添加新分区',
      'sidebar.heading.sections': '分区',
      'sidebar.heading.edit':   '编辑分区',
      'sidebar.footer':         '后端编辑器。内容保存在 <code>content.json</code>。',
      'editor.empty':           '在上方选择分区进行编辑。预览会实时更新。',
      'editor.noEditor':        '没有适用于"{type}"的编辑器。',
      'editor.id':              'ID',
      'editor.danger':          '删除此分区',
      'editor.delete':          '删除',
      'pop.lang.title':         '语言',
      'style.title':            '主题与字体',
      'style.resetAll':         '重置主题',
      'style.resetAll.title':   '重置此主题的所有颜色和字体',
      'style.close':            '关闭',
      'style.section.preset':   '主题预设',
      'style.section.colors':   '颜色',
      'style.section.fonts':    '字体',
      'style.resetColors':      '重置颜色',
      'style.resetFonts':       '重置字体',
      'style.reset.title':      '重置为主题默认',
      'style.customFonts':      '自定义字体',
      'style.uploadFont':       '+ 上传字体',
      'style.familyPlaceholder':'字体族名（例如 My Display）',
      'style.uploadHint':       '上传 .woff2、.woff、.ttf 或 .otf。为它指定字体族名以便从上方下拉列表中选择。',
      'style.loadGoogle':       '加载 Google 字体',
      'style.familyLabel':      '字体族名',
      'style.googlePlaceholder':'例如 Merriweather',
      'style.loadFontBtn':      '加载字体',
      'style.browseGoogle':     '浏览 Google Fonts ↗',
      'style.browseGoogle.title':'在新标签页打开 fonts.google.com 挑选字体,然后将字体族名粘贴到上方输入框',
      'style.loadGoogleHint':   '输入任意 Google 字体族名,它会被添加到上方的字体下拉列表中。',
      'style.noCustomFonts':    '暂无自定义字体。',
      'style.font.display':     '标题体',
      'style.font.body':        '正文',
      'style.font.script':      '手写体',
      'style.font.hint.display':'标题与大标题',
      'style.font.hint.body':   '段落',
      'style.font.hint.script': '手写点缀',
      'style.color.accent':     '强调色',
      'style.color.heading':    '标题色',
      'style.color.page-bg':    '页面背景',
      'style.color.page-fg':    '正文文字',
      'style.color.fg-muted':   '次要文字',
      'style.color.surface-2':  '表面',
      'picker.title':           '选择图片',
      'picker.upload':          '+ 上传',
      'picker.close':           '关闭',
      'picker.empty':           '暂无图片。请上传以开始。',
      'picker.confirmDelete':   '删除"{name}"？',
      'loading':                '正在加载作品集…',
      'field.placeholder.color':'#RRGGBB',
      'field.placeholder.img':  'images/…',
      'field.placeholder.url':  'https://…',
      'action.chooseImage':     '选择图片',
      'action.add':             '+ 添加',
      'action.remove':          '删除',
      'action.noImage':         '暂无图片',
      'field.stageName':        '艺名',
      'field.realName':         '本名',
      'field.portfolioLabel':   '作品集标签',
      'field.displayName':      '显示名',
      'field.coverImage':       '封面图',
      'field.role':             '角色',
      'field.heading':          '标题',
      'field.subheading':       '副标题',
      'field.body':             '正文',
      'field.image':            '图片',
      'field.photo':            '照片',
      'field.heroImage':        '主图',
      'field.title':            '标题',
      'field.institution':      '机构',
      'field.skillName':        '技能',
      'field.percent':          '百分比',
      'field.intro':            '简介',
      'field.playName':         '剧名',
      'field.showName':         '节目名',
      'field.work':             '作品',
      'field.categoryTitle':    '类目标题',
      'field.iconEmoji':        '图标（emoji）',
      'field.iconType':         '图标（phone / email / facebook / tiktok / instagram / youtube）',
      'field.label':            '标签',
      'field.value':            '值',
      'field.linkHref':         '链接 (href)',
      'field.play':             '剧目',
      'field.poster':           '海报',
      'card.artist':            '艺术家',
      'card.cover':             '封面',
      'card.about':             '关于',
      'card.personal':          '个人信息',
      'card.training':          '培训',
      'card.abilities':         '能力',
      'card.theatre':           '舞台剧集',
      'card.tvDramas':          '电视剧',
      'card.film':              '电影',
      'card.press':             '媒体报道',
      'card.contact':           '联系方式',
      'card.thankyou':          '感谢',
      'card.roles':             '角色',
      'card.sections':          '段落',
      'card.programs':          '课程',
      'card.skills':            '技能',
      'card.plays':             '剧目',
      'card.shows':             '节目',
      'card.categories':        '类别',
      'card.works':             '作品',
      'card.mentions':          '报道',
      'card.entries':           '条目',
      'card.fields':            '字段',
      'card.photos':            '照片',
      'card.trainingPhotos':    '培训照片',
      'card.tvPhotos':          '电视剧照片',
      'card.filmStills':        '电影剧照',
      'card.bodyPhotos':        '形体照',
      'card.links':             '链接',
      'type.cover':                 '封面',
      'type.about':                 '关于我',
      'type.personal-info':         '个人信息',
      'type.body-info':             '形体信息',
      'type.training':              '培训',
      'type.abilities':             '能力',
      'type.experiences-gallery':   '舞台',
      'type.experiences-tv':        '电视剧',
      'type.film-categories':       '电影',
      'type.media':                 '媒体',
      'type.contact':               '联系方式',
      'type.thankyou':              '感谢',
      'prompt.sectionType':     '分区类型？\n(cover, about, personal-info, body-info, training, abilities, experiences-gallery, experiences-tv, film-categories, media, contact, thankyou)',
      'prompt.sectionId':       '分区 ID？',
      'confirm.deleteSection':  '删除分区"{id}"？',
      'confirm.deleteFont':     '删除字体"{family}"？',
      'toast.themeReset':       '主题已重置',
      'toast.colorsReset':      '颜色已重置',
      'toast.fontsReset':       '字体已重置',
      'toast.fontLoaded':       '已加载 "{family}"',
      'toast.fontEnterName':    '请输入字体族名',
      'toast.fontUploaded':     '已上传 {count} 个字体',
      'toast.fontRemoved':      '字体已删除',
      'toast.imagesUploaded':   '已上传 {count} 张图片',
      'toast.uploadFailed':     '上传失败：{msg}',
      'toast.savedDisk':        '已保存到磁盘',
      'toast.saveFailed':       '保存失败：{msg}',
      'toast.saveStatic':       '运行 node server.js 才能保存编辑',
      'toast.idInUse':          'ID 已被使用',
      'toast.unknownType':      '未知类型：{type}',
      'error.staticFallback':   '无法加载 content.json — 请在此文件夹中运行 Node 服务（<code>node server.js</code>）。',
    },
  };

  function i18n(key, vars) {
    const lang = state.lang || 'vi';
    let s = (UI[lang] && UI[lang][key]) || (UI.en && UI.en[key]) || key;
    if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }

  // Localized label for a section type (falls back to the raw type).
  function typeLabel(type) {
    const key = 'type.' + type;
    const val = i18n(key);
    return val === key ? type : val;
  }

  // Apply the current language to every element flagged with data-i18n*.
  function applyI18n() {
    // Text content
    document.querySelectorAll('[data-i18n]').forEach(n => {
      const key = n.getAttribute('data-i18n');
      const html = n.getAttribute('data-i18n-html');
      if (html != null) n.innerHTML = i18n(key);
      else n.textContent = i18n(key);
    });
    // Titles (tooltips)
    document.querySelectorAll('[data-i18n-title]').forEach(n => {
      n.setAttribute('title', i18n(n.getAttribute('data-i18n-title')));
    });
    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(n => {
      n.setAttribute('placeholder', i18n(n.getAttribute('data-i18n-placeholder')));
    });
    // aria-label
    document.querySelectorAll('[data-i18n-aria-label]').forEach(n => {
      n.setAttribute('aria-label', i18n(n.getAttribute('data-i18n-aria-label')));
    });
    // <html lang>
    document.documentElement.setAttribute('lang', state.lang || 'vi');
  }

  // What the user can customise on each theme.
  // Labels/hints are resolved at render time via i18n() so the style modal
  // retranslates when the user switches language.
  const COLOR_VARS = [
    { name: '--accent',    labelKey: 'style.color.accent' },
    { name: '--heading',   labelKey: 'style.color.heading' },
    { name: '--page-bg',   labelKey: 'style.color.page-bg' },
    { name: '--page-fg',   labelKey: 'style.color.page-fg' },
    { name: '--fg-muted',  labelKey: 'style.color.fg-muted' },
    { name: '--surface-2', labelKey: 'style.color.surface-2' },
  ];
  const FONT_VARS = [
    { name: '--font-display', labelKey: 'style.font.display', hintKey: 'style.font.hint.display' },
    { name: '--font-body',    labelKey: 'style.font.body',    hintKey: 'style.font.hint.body' },
    { name: '--font-script',  labelKey: 'style.font.script',  hintKey: 'style.font.hint.script' },
  ];
  const THEME_VARS = [...COLOR_VARS, ...FONT_VARS].map(v => v.name);

  // Starter font catalogue (already preloaded in the base Google Fonts <link>)
  const BASE_FONTS = [
    'Playfair Display', 'Cormorant Garamond', 'Inter', 'Bebas Neue',
    'Dancing Script', 'Be Vietnam Pro',
    'Georgia', 'Times New Roman', 'Arial', 'Helvetica', 'system-ui',
    'ui-monospace',
  ];

  // ============================================================== HELPERS
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const esc = (s = '') =>
    String(s).replace(/[&<>"']/g, c =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const el = (tag, props = {}, ...kids) => {
    if (typeof tag === 'string' && tag.startsWith('<')) {
      const t = document.createElement('template');
      t.innerHTML = tag.trim();
      return t.content.firstElementChild;
    }
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'dataset') Object.assign(n.dataset, v);
      else if (k === 'style') Object.assign(n.style, v);
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else if (v === true) n.setAttribute(k, '');
      else if (v !== false && v != null) n.setAttribute(k, v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return n;
  };

  // multi-lang text helper — returns best string for current lang
  function t(field, lang = state.lang) {
    if (field == null) return '';
    if (typeof field === 'string' || typeof field === 'number') return String(field);
    if (typeof field === 'object') {
      if (field[lang] && String(field[lang]).trim()) return String(field[lang]);
      if (field.vi) return String(field.vi);
      if (field.en) return String(field.en);
      if (field.zh) return String(field.zh);
    }
    return '';
  }

  const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'cat';
  const sig = v => JSON.stringify(v);

  // Return an object { vi, en, zh } no matter what was stored
  function toLangObj(v) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return { vi: v.vi || '', en: v.en || '', zh: v.zh || '' };
    }
    return { vi: v == null ? '' : String(v), en: '', zh: '' };
  }

  // ============================================================== TOAST
  let toastTimer;
  function toast(msg, kind = 'ok') {
    const node = $('#toast');
    node.className = `toast toast--${kind}`;
    node.textContent = msg;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { node.hidden = true; }, 2200);
  }

  function renderStatus() {
    const n = $('#status');
    if (!n) return;
    // Strip state classes, then re-apply the correct one
    n.classList.remove('is-dirty', 'is-saved', 'is-err');
    if (state.isStatic) {
      n.classList.add('is-dirty');
      n.setAttribute('title', i18n('status.static'));
      return;
    }
    const dirty = sig(state.content) !== state.originalSig;
    if (dirty) {
      n.classList.add('is-dirty');
      n.setAttribute('title', i18n('status.dirty'));
    } else {
      n.classList.add('is-saved');
      n.setAttribute('title', i18n('status.saved'));
    }
  }

  // ============================================================== API
  async function fetchJson(url, opts = {}) {
    const r = await fetch(url, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts));
    const txt = await r.text();
    let body;
    try { body = txt ? JSON.parse(txt) : {}; } catch { throw new Error(`Bad JSON from ${url}: ${txt.slice(0,120)}`); }
    if (!r.ok) throw new Error(body.error || r.statusText);
    return body;
  }

  async function loadContent() {
    try {
      state.content = await fetchJson('/api/content');
      state.isStatic = false;
    } catch {
      // fallback: static mode
      try {
        const r = await fetch('content.json', { cache: 'no-cache' });
        state.content = await r.json();
        state.isStatic = true;
      } catch (err) {
        $('#portfolio').innerHTML = `<div class="loading" style="color:#c0392b">${i18n('error.staticFallback')}</div>`;
        throw err;
      }
    }
    state.originalSig = sig(state.content);

    // pull defaults from meta
    const meta = state.content.meta || {};
    state.lang        = meta.default_lang        || 'vi';
    state.theme       = meta.default_theme       || 'editorial';
    state.orientation = meta.default_orientation || 'landscape';
    state.themeOverrides = meta.theme_overrides || {};
    applyMetaToControls();
  }

  async function loadImages() {
    try {
      const r = await fetchJson('/api/images');
      state.images = r.images || [];
    } catch {
      state.images = [];
    }
  }

  async function saveContent() {
    if (state.isStatic) { toast(i18n('toast.saveStatic'), 'err'); return; }
    try {
      await fetchJson('/api/content', { method: 'PUT', body: JSON.stringify(state.content) });
      state.originalSig = sig(state.content);
      renderStatus();
      toast(i18n('toast.savedDisk'));
    } catch (e) {
      toast(i18n('toast.saveFailed', { msg: e.message }), 'err');
    }
  }

  async function uploadImage(file) {
    const dataUrl = await new Promise((ok, no) => {
      const r = new FileReader();
      r.onload = () => ok(r.result); r.onerror = no;
      r.readAsDataURL(file);
    });
    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '-');
    return fetchJson('/api/images', {
      method: 'POST',
      body: JSON.stringify({ filename: safeName, dataUrl }),
    });
  }
  const deleteImage = name => fetchJson(`/api/images/${encodeURIComponent(name)}`, { method: 'DELETE' });

  // ============================================================== PREVIEW
  function makePage(type, { title } = {}) {
    const page = document.createElement('section');
    page.className = 'page';
    page.dataset.type = type;
    page.innerHTML = `<div class="page__body"></div><footer class="page__footer"></footer>`;
    if (title) page.dataset.title = title;
    return page;
  }

  function renderHead(title, subtitle) {
    const parts = (title || '').split(' ');
    const first = parts.shift() || '';
    const rest = parts.join(' ');
    return `
      <header class="section-head">
        <div class="section-head__eyebrow">${esc(subtitle || '')}</div>
        <h2 class="section-head__title">${esc(first)}${rest ? ` <em>${esc(rest)}</em>` : ''}</h2>
        <div class="section-head__rule"></div>
      </header>`;
  }

  const templates = {
    cover(d) {
      const page = makePage('cover');
      page.classList.add('page--cover');
      const roles = (d.roles || []).map(r => t(r));
      page.querySelector('.page__body').innerHTML = `
        <div class="cover">
          <div class="cover__left">
            <div class="cover__name-frame">${esc(t(d.portfolio_label))}</div>
            <div class="cover__stage-name">${esc(t(d.name))}</div>
            <div class="cover__roles">${roles.map(r => `<span>${esc(r)}</span>`).join('')}</div>
          </div>
          <div class="cover__right">
            <img class="cover__img" src="${esc(d.image || '')}" alt="" />
          </div>
        </div>`;
      return [page];
    },

    about(d) {
      return (d.sections || []).map(s => {
        const page = makePage('about', { title: t(d.heading) });
        page.querySelector('.page__body').innerHTML = `
          ${renderHead(t(d.heading), t(d.subheading))}
          <div class="about">
            <div class="about__text">
              <p><span class="about__drop">${esc((t(s.body) || '').trim()[0] || '')}</span>${esc((t(s.body) || '').trim().slice(1))}</p>
            </div>
            <div class="about__photo"><img src="${esc(s.image || '')}" alt="" /></div>
          </div>`;
        return page;
      });
    },

    'personal-info'(d) {
      const page = makePage('personal');
      page.querySelector('.page__body').innerHTML = `
        ${renderHead(t(d.heading), t(d.subheading))}
        <div class="info">
          <div class="info__photo"><img src="${esc(d.image || '')}" alt="" /></div>
          <div class="info__fields">
            ${(d.fields || []).map(f => `
              <div class="field-row">
                <div class="field-row__label">${esc(t(f.label))}</div>
                <div class="field-row__value">${esc(t(f.value))}</div>
              </div>`).join('')}
          </div>
        </div>`;
      return [page];
    },

    'body-info'(d) {
      const page = makePage('body');
      page.querySelector('.page__body').innerHTML = `
        ${renderHead(t(d.heading), t(d.subheading))}
        <div class="info">
          <div class="info__photos">
            ${(d.images || []).map(src => `<div><img src="${esc(src)}" alt="" /></div>`).join('')}
          </div>
          <div class="info__fields">
            ${(d.fields || []).map(f => `
              <div class="field-row">
                <div class="field-row__label">${esc(t(f.label))}</div>
                <div class="field-row__value">${esc(t(f.value))}</div>
              </div>`).join('')}
          </div>
        </div>`;
      return [page];
    },

    training(d) {
      const page = makePage('training');
      page.querySelector('.page__body').innerHTML = `
        ${renderHead(t(d.heading), t(d.subheading))}
        <div class="training">
          <div class="training__list">
            ${(d.programs || []).map((p, i) => `
              <div class="training__item">
                <div class="training__num">${String(i + 1).padStart(2, '0')}</div>
                <div>
                  <div class="training__title">${esc(t(p.title))}</div>
                  <div class="training__inst">${esc(t(p.institution))}</div>
                </div>
              </div>`).join('')}
          </div>
          <div class="training__photos">
            ${(d.images || []).map(src => `<div><img src="${esc(src)}" alt="" /></div>`).join('')}
          </div>
        </div>`;
      return [page];
    },

    abilities(d) {
      const page = makePage('abilities');
      page.querySelector('.page__body').innerHTML = `
        ${renderHead(t(d.heading), t(d.subheading))}
        <div class="abilities">
          <div class="abilities__photo"><img src="${esc(d.image || '')}" alt="" /></div>
          <div class="abilities__grid">
            ${(d.skills || []).map(s => {
              const label = t(s.name || { vi: s.vi, en: s.en, zh: s.zh });
              return `
              <div class="skill">
                <div class="skill__ring" style="--pct:${s.percent}">
                  <div class="skill__pct">${s.percent}%</div>
                </div>
                <div class="skill__name">${esc(label)}</div>
              </div>`;
            }).join('')}
          </div>
        </div>`;
      return [page];
    },

    'experiences-gallery'(d) {
      const plays = d.plays || [];
      const pages = [];
      const perPage = 8; // consistent 4-col × 2-row grid across all pages

      const cardHtml = p => `
        <div class="play-card">
          <div class="play-card__img"><img src="${esc(p.image || '')}" alt="" /></div>
          <div class="play-card__cap">
            <div class="play-card__name">${esc(t(p.name))}</div>
            <div class="play-card__role">${labelForRole()} ${esc(t(p.role))}</div>
          </div>
        </div>`;

      // Chunk into pages of `perPage`; first page also carries the intro.
      for (let i = 0; i < Math.max(plays.length, 1); i += perPage) {
        const chunk = plays.slice(i, i + perPage);
        const isFirst = i === 0;
        const page = makePage('theatre', { title: t(d.heading) });
        page.querySelector('.page__body').innerHTML = `
          ${renderHead(t(d.heading), t(d.subheading))}
          <div class="gallery">
            ${isFirst && t(d.intro) ? `<p class="gallery__intro">${esc(t(d.intro))}</p>` : ''}
            <div class="plays-grid">
              ${chunk.map(cardHtml).join('')}
            </div>
          </div>`;
        pages.push(page);
      }
      return pages;
    },

    'experiences-tv'(d) {
      const page = makePage('tv');
      page.querySelector('.page__body').innerHTML = `
        ${renderHead(t(d.heading), t(d.subheading))}
        <div class="tv">
          <div class="tv__grid">
            ${(d.images || []).map(src => `<div><img src="${esc(src)}" alt="" /></div>`).join('')}
          </div>
          <div class="tv__copy">
            <p>${esc(t(d.intro))}</p>
            <ul class="tv__shows">
              ${(d.shows || []).map(s => `<li>${esc(t(s))}</li>`).join('')}
            </ul>
          </div>
        </div>`;
      return [page];
    },

    'film-categories'(d) {
      const page = makePage('film');
      page.querySelector('.page__body').innerHTML = `
        ${renderHead(t(d.heading), t(d.subheading))}
        <div class="film">
          <div class="film__gallery">
            ${(d.images || []).slice(0, 9).map(src => `<div><img src="${esc(src)}" alt="" /></div>`).join('')}
          </div>
          <div class="film__cats">
            ${(d.categories || []).map(c => `
              <div class="film__cat">
                <div class="film__icon">${esc(c.icon || '')}</div>
                <div>
                  <div class="film__ctitle">${esc(t(c.title))}</div>
                  <div class="film__works">${esc((c.works || []).map(w => t(w)).join(', '))}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>`;
      return [page];
    },

    media(d) {
      const page = makePage('media');
      page.querySelector('.page__body').innerHTML = `
        ${renderHead(t(d.heading), t(d.subheading))}
        <div class="media-grid">
          ${(d.mentions || []).map(m => `
            <div class="media-card">
              <div class="media-card__poster"><img src="${esc(m.poster || '')}" alt="" /></div>
              <div class="media-card__body">
                <div class="media-card__play">${esc(t(m.play))}</div>
                <div class="media-card__links">
                  ${(m.links || []).map(l => `<a class="media-card__link" href="${esc(l)}" target="_blank" rel="noopener">${esc(String(l).replace(/^https?:\/\//, ''))}</a>`).join('')}
                </div>
              </div>
            </div>`).join('')}
        </div>`;
      return [page];
    },

    contact(d) {
      const page = makePage('contact');
      const icon = name => ({
        phone:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
        facebook: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13 22v-8h3l1-4h-4V7c0-1.2.4-2 2-2h2V1.5C16 1.2 14.8 1 13.3 1 10.5 1 9 2.7 9 5.8V10H5v4h4v8h4z"/></svg>`,
        email:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>`,
        tiktok:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 3v3.3c1 1 2.5 1.7 4 1.7v3a8 8 0 0 1-4-1.2V15a6 6 0 1 1-6-6v3a3 3 0 1 0 3 3V3h3z"/></svg>`,
        instagram:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
        youtube:  `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23 7s-.2-1.6-.8-2.3c-.8-.9-1.7-.9-2.1-1C17.1 3.4 12 3.4 12 3.4s-5.1 0-8.1.3c-.4 0-1.3.1-2.1 1C1.2 5.4 1 7 1 7s-.2 1.8-.2 3.7v1.8c0 1.9.2 3.7.2 3.7s.2 1.6.8 2.3c.8.9 1.9.9 2.4 1 1.7.2 7.8.3 7.8.3s5.1 0 8.1-.3c.4 0 1.3-.1 2.1-1 .6-.7.8-2.3.8-2.3s.2-1.8.2-3.7v-1.8c0-1.9-.2-3.7-.2-3.7zM9.7 15V7.9l6.4 3.6-6.4 3.6z"/></svg>`,
      }[name] || '');
      page.querySelector('.page__body').innerHTML = `
        ${renderHead(t(d.heading), t(d.subheading))}
        <div class="contact">
          <div class="contact__photo"><img src="${esc(d.image || '')}" alt="" /></div>
          <div class="contact__list">
            ${(d.entries || []).map(e => `
              <a class="contact__row" href="${esc(e.href || '#')}" target="_blank" rel="noopener">
                <div class="contact__icon">${icon(e.icon)}</div>
                <div>
                  <div class="contact__label">${esc(t(e.label))}</div>
                  <div class="contact__value">${esc(t(e.value))}</div>
                </div>
              </a>`).join('')}
          </div>
        </div>`;
      return [page];
    },

    thankyou(d) {
      const page = makePage('thankyou');
      page.classList.add('page--thankyou');
      const title = (t(d.heading) || 'THANK YOU').split(' ');
      const first = title[0];
      const rest  = title.slice(1).join(' ');
      page.querySelector('.page__body').innerHTML = `
        <div class="thankyou">
          ${(d.images || []).map(src => `<div><img src="${esc(src)}" alt="" /></div>`).join('')}
          <div class="thankyou__overlay">
            <div class="thankyou__title">${esc(first)}${rest ? `<em>${esc(rest)}</em>` : ''}</div>
            <div class="thankyou__sub">${esc(t(d.subheading))}</div>
          </div>
        </div>`;
      return [page];
    },
  };

  function labelForRole() {
    return { vi: 'trong vai', en: 'as', zh: '饰' }[state.lang] || 'as';
  }

  function renderPreview() {
    const root = $('#portfolio');
    root.setAttribute('aria-busy', 'false');
    root.innerHTML = '';

    const allPages = [];
    for (const cat of state.content.categories) {
      const tpl = templates[cat.type];
      if (!tpl) { console.warn('no template for type', cat.type); continue; }
      const pages = tpl(cat.data || {}, cat) || [];
      pages.forEach((p, i) => {
        p.dataset.catId = cat.id;
        p.dataset.pageIndex = i + 1;
        p.dataset.pagesInCat = pages.length;
        if (cat.id === state.selectedId) p.style.outline = '3px solid rgba(217,176,121,.4)';
        allPages.push(p);
        root.appendChild(p);
      });
    }
    // Footer: page number + language-aware stage-name token
    const footerName = footerNameForLang(state.lang);
    allPages.forEach((p, i) => {
      const footer = p.querySelector('.page__footer');
      if (footer) {
        footer.dataset.page = String(i + 1).padStart(2, '0');
        footer.dataset.footer = footerName;
      }
    });
  }

  // Stage-name shown in page footer — resolved per language with fallbacks
  function footerNameForLang(lang) {
    const cats = (state.content && state.content.categories) || [];
    const cover = cats.find(c => c.type === 'cover');
    const nameField = cover && cover.data && cover.data.name;
    const v = t(nameField, lang);
    if (v && v.trim()) return v;
    return { vi: 'LÂM THANH TIỆP', en: 'LAM THANH TIEP', zh: '林青蝶' }[lang] || 'LÂM THANH TIỆP';
  }

  // ============================================================== CONTROLS BINDING

  // Capture per-theme CSS-var defaults so we can reset reliably.
  // Must run BEFORE any inline overrides are applied.
  function captureThemeDefaults() {
    const themes = ['editorial', 'cinematic', 'minimal', 'romantic', 'couture'];
    const prevTheme = document.body.dataset.theme;
    // Remove any inline overrides (just in case)
    THEME_VARS.forEach(v => document.body.style.removeProperty(v));
    for (const theme of themes) {
      document.body.dataset.theme = theme;
      const cs = getComputedStyle(document.body);
      const snap = {};
      THEME_VARS.forEach(v => { snap[v] = cs.getPropertyValue(v).trim(); });
      state.themeDefaults[theme] = snap;
    }
    // Restore the active theme
    document.body.dataset.theme = prevTheme || state.theme;
  }

  function applyMetaToControls() {
    document.body.dataset.theme = state.theme;
    document.body.dataset.orientation = state.orientation;
    applyThemeOverrides();
    updatePrintPageRule();
    // Re-translate every static string (rail tooltips, sidebar headings,
    // modal chrome, placeholders, popover titles, loading text…)
    applyI18n();
    updateRailUI();
    renderStatus();
    // Language segmented (top toolbar)
    $$('.lang-seg__btn').forEach(c => {
      const on = c.dataset.lang === state.lang;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    // Theme chips inside docked style panel
    $$('#theme-chips .theme-chip').forEach(c => {
      const on = c.dataset.theme === state.theme;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    // Dock is open? Rebuild its editors so they reflect the active theme.
    const dock = $('#style-dock');
    if (dock && !dock.hidden) {
      buildColorEditor();
      buildFontEditor();
      renderFontLibraryList();
    }
  }

  function updateRailUI() {
    // Orientation icons (now inside #toolbar-orient)
    const rLand = document.querySelector('#toolbar-orient .rail__svg-landscape');
    const rPort = document.querySelector('#toolbar-orient .rail__svg-portrait');
    if (rLand && rPort) {
      rLand.style.display = state.orientation === 'landscape' ? '' : 'none';
      rPort.style.display = state.orientation === 'portrait'  ? '' : 'none';
    }
    const tOrient = $('#toolbar-orient');
    if (tOrient) {
      tOrient.title = state.orientation === 'landscape'
        ? i18n('rail.orient.landscape')
        : i18n('rail.orient.portrait');
    }
    // Status dot now lives in the toolbar — ensure the class matches new selector.
    const st = $('#status');
    if (st && !st.classList.contains('toolbar__status')) {
      st.classList.add('toolbar__status');
    }
  }

  function applyThemeOverrides() {
    THEME_VARS.forEach(v => document.body.style.removeProperty(v));
    const ov = state.themeOverrides[state.theme] || {};
    for (const [k, v] of Object.entries(ov)) {
      if (v) document.body.style.setProperty(k, v);
    }
  }

  // -- helpers ----------------------------------------------------------
  function getDefault(varName) {
    return (state.themeDefaults[state.theme] || {})[varName] || '';
  }
  function getOverride(varName) {
    return (state.themeOverrides[state.theme] || {})[varName] || '';
  }
  function getEffective(varName) {
    return getOverride(varName) || getDefault(varName);
  }

  function setOverride(varName, value) {
    state.themeOverrides[state.theme] = state.themeOverrides[state.theme] || {};
    state.themeOverrides[state.theme][varName] = value;
    state.content.meta = state.content.meta || {};
    state.content.meta.theme_overrides = state.themeOverrides;
    if (value) document.body.style.setProperty(varName, value);
    else document.body.style.removeProperty(varName);
  }
  function clearOverride(varName) {
    const ov = state.themeOverrides[state.theme];
    if (!ov) return;
    delete ov[varName];
    if (!Object.keys(ov).length) delete state.themeOverrides[state.theme];
    state.content.meta = state.content.meta || {};
    state.content.meta.theme_overrides = state.themeOverrides;
    document.body.style.removeProperty(varName);
    // Re-apply remaining overrides so the removed one falls back to stylesheet
    applyThemeOverrides();
  }

  function toHex(color) {
    if (!color) return '';
    color = color.trim();
    if (color.startsWith('#') && (color.length === 7 || color.length === 4)) {
      if (color.length === 4) {
        return '#' + color.slice(1).split('').map(c => c + c).join('');
      }
      return color.toUpperCase();
    }
    const m = color.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const [r, g, b] = m[1].split(',').map(s => parseInt(s.trim(), 10));
      return ('#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('')).toUpperCase();
    }
    return '';
  }
  function isValidHex(s) {
    return /^#?[0-9a-f]{6}$/i.test(String(s).trim()) || /^#?[0-9a-f]{3}$/i.test(String(s).trim());
  }
  function normalizeHex(s) {
    let v = String(s).trim();
    if (!v.startsWith('#')) v = '#' + v;
    if (v.length === 4) v = '#' + v.slice(1).split('').map(c => c + c).join('');
    return v.toUpperCase();
  }

  function updatePrintPageRule() {
    let style = document.getElementById('print-page-size');
    if (!style) {
      style = document.createElement('style');
      style.id = 'print-page-size';
      document.head.appendChild(style);
    }
    style.textContent = `@media print { @page { size: A4 ${state.orientation}; margin: 0; } }`;
  }

  // ============================================================== STYLE PANEL
  function buildColorEditor() {
    const host = $('#color-editor');
    if (!host) return;
    host.innerHTML = '';
    COLOR_VARS.forEach(({ name, labelKey }) => {
      const row = el('div', { class: 'color-field-row' });
      const current = getEffective(name);
      const hex = toHex(current) || '#000000';
      const swatch = el('input', {
        type: 'color', class: 'color-field-row__swatch',
        value: hex, title: i18n('style.color.accent'),
      });
      const hexIn = el('input', {
        class: 'color-field-row__hex', value: hex,
        spellcheck: 'false', autocomplete: 'off',
        placeholder: i18n('field.placeholder.color'),
      });
      const labelEl = el('div', { class: 'color-field-row__label' }, i18n(labelKey));
      const resetBtn = el('button', {
        class: 'reset-ico', title: i18n('style.reset.title'),
        onclick: () => {
          clearOverride(name);
          buildColorEditor();
          dirty();
        },
      }, '↺');
      const body = el('div', { class: 'color-field-row__body' }, labelEl, hexIn);
      if (!getOverride(name)) resetBtn.setAttribute('disabled', '');

      swatch.addEventListener('input', () => {
        const v = (swatch.value || '').toUpperCase();
        hexIn.value = v;
        setOverride(name, v);
        resetBtn.removeAttribute('disabled');
        dirty();
      });
      hexIn.addEventListener('change', () => {
        if (!isValidHex(hexIn.value)) {
          hexIn.value = toHex(getEffective(name)) || '#000000';
          return;
        }
        const v = normalizeHex(hexIn.value);
        hexIn.value = v;
        swatch.value = v;
        setOverride(name, v);
        resetBtn.removeAttribute('disabled');
        dirty();
      });

      row.append(swatch, body, resetBtn);
      host.append(row);
    });
  }

  function buildFontEditor() {
    const host = $('#font-editor');
    if (!host) return;
    host.innerHTML = '';
    const families = allKnownFontFamilies();
    FONT_VARS.forEach(({ name, labelKey, hintKey }) => {
      const row = el('div', { class: 'font-field-row' });
      const current = getEffective(name);
      const family = firstFamily(current) || '';
      const labelEl = el('div', { class: 'font-field-row__label' }, i18n(labelKey),
        el('small', {}, i18n(hintKey)));
      const select = el('select', { class: 'input' });
      // Custom + Google Fonts + Base fonts, deduped
      families.forEach(fam => {
        const opt = el('option', { value: fam }, fam);
        if (fam.toLowerCase() === family.toLowerCase()) opt.selected = true;
        select.append(opt);
      });
      // If current isn't in the list, add it
      if (family && !families.some(f => f.toLowerCase() === family.toLowerCase())) {
        const opt = el('option', { value: family, selected: true }, family + ' (current)');
        select.prepend(opt);
      }
      const resetBtn = el('button', {
        class: 'reset-ico', title: i18n('style.reset.title'),
        onclick: () => {
          clearOverride(name);
          buildFontEditor();
          dirty();
        },
      }, '↺');
      if (!getOverride(name)) resetBtn.setAttribute('disabled', '');

      select.addEventListener('change', () => {
        const fam = select.value;
        const stack = buildFontStack(name, fam);
        setOverride(name, stack);
        resetBtn.removeAttribute('disabled');
        preview.style.fontFamily = stack;
        dirty();
      });

      const preview = el('div', {
        class: 'font-field-row__preview',
        style: { fontFamily: current || 'inherit' },
      }, 'Lâm Thanh Tiệp — Portfolio Studio');

      row.append(labelEl, select, resetBtn, preview);
      host.append(row);
    });
  }

  function firstFamily(stack) {
    if (!stack) return '';
    const first = String(stack).split(',')[0].trim().replace(/^["']|["']$/g, '');
    return first;
  }
  function buildFontStack(varName, family) {
    // Keep fallbacks sensible for display/body/script
    const fallback = varName === '--font-body'
      ? '"Inter", system-ui, sans-serif'
      : varName === '--font-script'
      ? '"Cormorant Garamond", Georgia, serif'
      : 'Georgia, serif';
    // If family is a system-ish generic, don't wrap in quotes
    const GENERIC = new Set(['system-ui', 'ui-monospace', 'serif', 'sans-serif', 'monospace']);
    const head = GENERIC.has(family) ? family : `"${family}"`;
    return `${head}, ${fallback}`;
  }

  function allKnownFontFamilies() {
    const set = new Set(BASE_FONTS);
    state.googleFonts.forEach(f => set.add(f));
    state.customFonts.forEach(f => set.add(f.family));
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  // --------- Google Fonts dynamic loader ------------------------------
  function loadGoogleFont(family) {
    if (!family) return false;
    family = family.trim();
    if (!family) return false;
    // Already loaded?
    if (state.googleFonts.some(f => f.toLowerCase() === family.toLowerCase())) return true;

    const id = 'gf-' + family.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.id = id;
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap`;
      document.head.appendChild(link);
    }
    state.googleFonts.push(family);
    state.content.meta = state.content.meta || {};
    state.content.meta.google_fonts = state.googleFonts;
    return true;
  }

  // --------- Custom font library (server-backed) ----------------------
  async function loadCustomFonts() {
    try {
      const r = await fetchJson('/api/fonts');
      state.customFonts = r.fonts || [];
    } catch { state.customFonts = []; }
    injectCustomFontFaces();
  }
  function injectCustomFontFaces() {
    let tag = document.getElementById('custom-fonts-style');
    if (!tag) {
      tag = document.createElement('style');
      tag.id = 'custom-fonts-style';
      document.head.appendChild(tag);
    }
    const css = state.customFonts.map(f =>
      `@font-face{font-family:"${f.family}";src:url("${f.url}");font-display:swap;}`
    ).join('\n');
    tag.textContent = css;
  }
  async function uploadCustomFont(file, family) {
    const dataUrl = await new Promise((ok, no) => {
      const r = new FileReader();
      r.onload = () => ok(r.result); r.onerror = no;
      r.readAsDataURL(file);
    });
    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '-');
    return fetchJson('/api/fonts', {
      method: 'POST',
      body: JSON.stringify({ filename: safeName, family, dataUrl }),
    });
  }
  const deleteCustomFont = name =>
    fetchJson(`/api/fonts/${encodeURIComponent(name)}`, { method: 'DELETE' });

  function renderFontLibraryList() {
    const host = $('#font-library-list');
    if (!host) return;
    host.innerHTML = '';
    if (!state.customFonts.length) {
      host.append(el('div', { class: 'hint' }, i18n('style.noCustomFonts')));
      return;
    }
    state.customFonts.forEach(f => {
      const row = el('div', { class: 'font-library__row' });
      row.append(
        el('div', {},
          el('strong', { style: { fontFamily: `"${f.family}"` } }, f.family),
          el('small', {}, f.name),
        ),
        el('button', {
          class: 'btn--xs btn--danger',
          onclick: async () => {
            if (!confirm(i18n('confirm.deleteFont', { family: f.family }))) return;
            try { await deleteCustomFont(f.name); }
            catch (err) { toast(err.message, 'err'); return; }
            await loadCustomFonts();
            renderFontLibraryList();
            buildFontEditor();
            toast(i18n('toast.fontRemoved'));
          },
        }, i18n('action.remove')),
      );
      host.append(row);
    });
  }

  // --------- Popover positioning --------------------------------------
  function positionPopover(pop, anchorId) {
    const anchor = document.getElementById(anchorId);
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    pop.style.top = `${Math.round(r.top)}px`;
    pop.style.left = `${Math.round(r.right + 10)}px`;
  }
  function showPopover(pop, anchorId) {
    // Close other popovers
    $$('.popover').forEach(p => { if (p !== pop) p.hidden = true; });
    pop.hidden = false;
    positionPopover(pop, anchorId);
  }
  function hideAllPopovers() {
    $$('.popover').forEach(p => p.hidden = true);
  }

  // --------- Style dock open/close -----------------------------------
  function openStyleModal() {
    const dock = $('#style-dock');
    if (!dock) return;
    dock.hidden = false;
    document.body.classList.add('is-dock-open');
    const btn = $('#toolbar-style');
    if (btn) { btn.classList.add('is-active'); btn.setAttribute('aria-pressed', 'true'); }
    buildColorEditor();
    buildFontEditor();
    renderFontLibraryList();
  }
  function closeStyleModal() {
    const dock = $('#style-dock');
    if (dock) dock.hidden = true;
    document.body.classList.remove('is-dock-open');
    const btn = $('#toolbar-style');
    if (btn) { btn.classList.remove('is-active'); btn.setAttribute('aria-pressed', 'false'); }
  }
  function toggleStyleModal() {
    const dock = $('#style-dock');
    if (!dock) return;
    if (dock.hidden) openStyleModal();
    else closeStyleModal();
  }

  // ============================================================== SIDEBAR: CAT LIST
  function renderCatList() {
    const host = $('#cat-list');
    host.innerHTML = '';
    (state.content.categories || []).forEach(cat => {
      const item = el('div', {
        class: 'cat-item' + (cat.id === state.selectedId ? ' is-active' : ''),
        draggable: 'true',
        dataset: { id: cat.id },
        onclick: () => selectCat(cat.id),
      });
      item.append(
        el('span', { class: 'cat-item__handle' }, '⋮⋮'),
        el('div', { class: 'cat-item__title', title: t(cat.data?.heading || cat.data?.portfolio_label || cat.id) },
          t(cat.data?.heading || cat.data?.portfolio_label || cat.id) || cat.id),
        el('span', { class: 'cat-item__type', title: cat.type }, typeLabel(cat.type)),
      );
      // drag-and-drop reorder
      item.addEventListener('dragstart', e => {
        item.classList.add('is-dragging');
        e.dataTransfer.setData('text/plain', cat.id);
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => item.classList.remove('is-dragging'));
      item.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
      item.addEventListener('drop', e => {
        e.preventDefault();
        const srcId = e.dataTransfer.getData('text/plain');
        if (!srcId || srcId === cat.id) return;
        const arr = state.content.categories;
        const from = arr.findIndex(c => c.id === srcId);
        const to   = arr.findIndex(c => c.id === cat.id);
        if (from < 0 || to < 0) return;
        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved);
        dirty();
        renderCatList();
        renderPreview();
      });

      host.appendChild(item);
    });
  }

  function selectCat(id) {
    state.selectedId = id;
    renderCatList();
    renderPreview();
    renderEditor();
    // scroll first page of cat into view
    const target = $(`.page[data-cat-id="${CSS.escape(id)}"]`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ============================================================== EDITOR (merged admin)
  function dirty() {
    renderStatus();
    renderPreview();
  }

  function renderEditor() {
    const host = $('#editor');
    host.innerHTML = '';
    const cat = state.content.categories.find(c => c.id === state.selectedId);
    if (!cat) {
      host.append(el('div', { class: 'editor__empty' }, i18n('editor.empty')));
      return;
    }

    // Header card
    const head = el('div', { class: 'card' });
    head.append(
      el('div', { class: 'card__title' },
        el('span', { class: 'dot' }),
        typeLabel(cat.type),
      ),
      fieldRow(i18n('editor.id'), el('input', {
        class: 'input',
        value: cat.id,
        onchange: e => {
          const v = slug(e.target.value);
          if (!v || state.content.categories.some(c => c !== cat && c.id === v)) {
            e.target.value = cat.id;
            return;
          }
          cat.id = v;
          state.selectedId = v;
          renderCatList();
          dirty();
        },
      })),
    );
    host.append(head);

    // Type-specific editor
    const builder = editors[cat.type];
    if (builder) {
      const nodes = builder(cat.data || (cat.data = {}));
      (Array.isArray(nodes) ? nodes : [nodes]).forEach(n => host.append(n));
    } else {
      host.append(el('div', { class: 'editor__empty' },
        i18n('editor.noEditor', { type: cat.type })));
    }

    // Danger zone
    const dz = el('div', { class: 'danger-zone' });
    dz.append(
      el('span', {}, i18n('editor.danger')),
      el('button', {
        class: 'btn btn--danger btn--xs',
        onclick: () => {
          if (!confirm(i18n('confirm.deleteSection', { id: cat.id }))) return;
          state.content.categories = state.content.categories.filter(c => c !== cat);
          state.selectedId = null;
          renderCatList(); renderEditor(); dirty();
        },
      }, i18n('editor.delete')),
    );
    host.append(dz);
  }

  // small layout helpers
  function fieldRow(label, input) {
    return el('div', { class: 'field' },
      el('label', { class: 'field__label' }, label),
      input,
    );
  }

  // Multi-lang text field (tabs for VI/EN/ZH)
  function langTextField(label, obj, onChange, { textarea = false } = {}) {
    const lo = toLangObj(obj);
    let activeLang = state.lang;
    const wrap = el('div', { class: 'field' });
    const head = el('label', { class: 'field__label' }, label);
    const tabs = el('div', { class: 'lang-tabs' });
    LANGS.forEach(lg => {
      const btn = el('button', {
        class: 'lang-tabs__btn' + (lg === activeLang ? ' is-active' : ''),
        onclick: e => { e.preventDefault(); activeLang = lg; refresh(); },
      }, lg.toUpperCase());
      tabs.append(btn);
    });
    head.append(tabs);
    wrap.append(head);

    let input;
    const refresh = () => {
      tabs.querySelectorAll('.lang-tabs__btn').forEach((b, i) =>
        b.classList.toggle('is-active', LANGS[i] === activeLang));
      if (input) input.value = lo[activeLang] || '';
    };
    const props = {
      class: 'input',
      value: lo[activeLang] || '',
      oninput: e => { lo[activeLang] = e.target.value; onChange(lo); dirty(); },
    };
    input = textarea ? el('textarea', props) : el('input', props);
    wrap.append(input);
    refresh();
    return wrap;
  }

  function textField(label, val, onChange) {
    return fieldRow(label, el('input', {
      class: 'input', value: val || '',
      oninput: e => { onChange(e.target.value); dirty(); },
    }));
  }

  function numField(label, val, onChange) {
    return fieldRow(label, el('input', {
      class: 'input', type: 'number', value: val ?? 0,
      oninput: e => { onChange(Number(e.target.value)); dirty(); },
    }));
  }

  function imgField(label, val, onChange) {
    const wrap = el('div', { class: 'field' });
    wrap.append(el('label', { class: 'field__label' }, label));
    const grid = el('div', { class: 'img-field' });
    const preview = el('div', { class: 'img-field__preview' });
    const refreshPreview = () => {
      preview.innerHTML = val ? `<img src="${esc(val)}" alt="" />` : esc(i18n('action.noImage'));
    };
    refreshPreview();
    const ctrls = el('div', { class: 'img-field__ctrls' });
    const pathIn = el('input', {
      class: 'input', value: val || '', placeholder: i18n('field.placeholder.img'),
      oninput: e => { val = e.target.value; onChange(val); refreshPreview(); dirty(); },
    });
    ctrls.append(
      pathIn,
      el('button', {
        class: 'btn btn--xs',
        onclick: () => openPicker({ set: name => {
          val = 'images/' + name;
          pathIn.value = val;
          onChange(val);
          refreshPreview();
          dirty();
        }}),
      }, i18n('action.chooseImage')),
    );
    grid.append(preview, ctrls);
    wrap.append(grid);
    return wrap;
  }

  function imgListField(label, arr, { onChange } = {}) {
    const wrap = el('div', { class: 'field' });
    wrap.append(el('label', { class: 'field__label' }, label));
    const list = el('div', { class: 'img-list' });
    const rebuild = () => {
      list.innerHTML = '';
      arr.forEach((src, i) => {
        const item = el('div', { class: 'img-list__item' });
        item.innerHTML = `<img src="${esc(src)}" alt="" />`;
        const btn = el('button', {
          onclick: () => { arr.splice(i, 1); rebuild(); onChange && onChange(arr); dirty(); },
        }, '×');
        item.append(btn);
        list.append(item);
      });
      const add = el('button', {
        class: 'img-list__add',
        onclick: () => openPicker({
          multi: true,
          set: names => {
            names.forEach(n => arr.push('images/' + n));
            rebuild(); onChange && onChange(arr); dirty();
          },
        }),
      }, i18n('action.add'));
      list.append(add);
    };
    rebuild();
    wrap.append(list);
    return wrap;
  }

  // Multi-lang item list (programs, skills, plays, shows, etc.)
  function objListField(label, arr, build, makeEmpty) {
    const wrap = el('div', { class: 'card' });
    wrap.append(el('div', { class: 'card__title' },
      el('span', {}, label),
      el('button', {
        class: 'btn--xs',
        onclick: () => { arr.push(makeEmpty()); rebuild(); dirty(); },
      }, i18n('action.add')),
    ));
    const host = el('div', { class: 'items' });

    const rebuild = () => {
      host.innerHTML = '';
      arr.forEach((it, i) => {
        const card = el('div', { class: 'item' });
        card.append(el('div', { class: 'item__bar' },
          el('span', { class: 'item__handle' }, '⋮⋮'),
          el('span', { class: 'item__badge' }, '#' + (i + 1)),
          el('div', { class: 'item__actions' },
            el('button', {
              class: 'btn--xs', disabled: i === 0,
              onclick: () => { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); rebuild(); dirty(); },
            }, '↑'),
            el('button', {
              class: 'btn--xs', disabled: i === arr.length - 1,
              onclick: () => { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); rebuild(); dirty(); },
            }, '↓'),
            el('button', {
              class: 'btn--xs',
              onclick: () => { arr.splice(i, 1); rebuild(); dirty(); },
            }, '×'),
          ),
        ));
        build(card, it, i);
        host.append(card);
      });
    };
    rebuild();
    wrap.append(host);
    return wrap;
  }

  // ============================================================== TYPE EDITORS
  const editors = {
    cover(d) {
      d.roles = d.roles || [];
      const nodes = [];
      const meta = state.content.meta || (state.content.meta = {});
      meta.name = toLangObj(meta.name);
      const metaCard = el('div', { class: 'card' });
      metaCard.append(
        el('div', { class: 'card__title' }, i18n('card.artist')),
        langTextField(i18n('field.stageName'), meta.name, v => { state.content.meta.name = v; }),
        textField(i18n('field.realName'), meta.real_name, v => state.content.meta.real_name = v),
      );
      nodes.push(metaCard);

      const coverCard = el('div', { class: 'card' });
      coverCard.append(
        el('div', { class: 'card__title' }, i18n('card.cover')),
        langTextField(i18n('field.portfolioLabel'), (d.portfolio_label = toLangObj(d.portfolio_label)),
          v => d.portfolio_label = v),
        langTextField(i18n('field.displayName'), (d.name = toLangObj(d.name)), v => d.name = v),
        imgField(i18n('field.coverImage'), d.image, v => d.image = v),
      );
      nodes.push(coverCard);

      const rolesList = objListField(i18n('card.roles'), d.roles,
        (card, _role, i) => {
          const ref = toLangObj(d.roles[i]);
          d.roles[i] = ref;
          card.append(langTextField(i18n('field.role'), ref, v => { d.roles[i] = v; }));
        },
        () => ({ vi: '', en: '', zh: '' }),
      );
      nodes.push(rolesList);
      return nodes;
    },

    about(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, i18n('card.about')),
        langTextField(i18n('field.heading'), (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField(i18n('field.subheading'), (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
      );
      nodes.push(head);
      d.sections = d.sections || [];
      nodes.push(objListField(i18n('card.sections'), d.sections,
        (card, s) => {
          s.body = toLangObj(s.body);
          card.append(
            langTextField(i18n('field.body'), s.body, v => s.body = v, { textarea: true }),
            imgField(i18n('field.image'), s.image, v => s.image = v),
          );
        },
        () => ({ body: { vi: '', en: '', zh: '' }, image: '' }),
      ));
      return nodes;
    },

    'personal-info': infoEditor,
    'body-info':     bodyInfoEditor,

    training(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, i18n('card.training')),
        langTextField(i18n('field.heading'), (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField(i18n('field.subheading'), (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
      );
      nodes.push(head);
      d.programs = d.programs || [];
      nodes.push(objListField(i18n('card.programs'), d.programs,
        (card, p) => {
          p.title = toLangObj(p.title);
          p.institution = toLangObj(p.institution);
          card.append(
            langTextField(i18n('field.title'), p.title, v => p.title = v),
            langTextField(i18n('field.institution'), p.institution, v => p.institution = v),
          );
        },
        () => ({ title: { vi: '', en: '', zh: '' }, institution: { vi: '', en: '', zh: '' } }),
      ));
      d.images = d.images || [];
      nodes.push(el('div', { class: 'card' },
        el('div', { class: 'card__title' }, i18n('card.photos')),
        imgListField(i18n('card.trainingPhotos'), d.images, { onChange: v => d.images = v }),
      ));
      return nodes;
    },

    abilities(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, i18n('card.abilities')),
        langTextField(i18n('field.heading'), (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField(i18n('field.subheading'), (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
        imgField(i18n('field.heroImage'), d.image, v => d.image = v),
      );
      nodes.push(head);
      d.skills = d.skills || [];
      nodes.push(objListField(i18n('card.skills'), d.skills,
        (card, s) => {
          s.name = toLangObj(s.name || { vi: s.vi, en: s.en, zh: s.zh });
          // clean up legacy keys
          delete s.vi; delete s.en; delete s.zh;
          card.append(
            langTextField(i18n('field.skillName'), s.name, v => s.name = v),
            numField(i18n('field.percent'), s.percent, v => s.percent = Math.max(0, Math.min(100, v))),
          );
        },
        () => ({ name: { vi: '', en: '', zh: '' }, percent: 50 }),
      ));
      return nodes;
    },

    'experiences-gallery'(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, i18n('card.theatre')),
        langTextField(i18n('field.heading'), (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField(i18n('field.subheading'), (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
        langTextField(i18n('field.intro'), (d.intro = toLangObj(d.intro)), v => d.intro = v, { textarea: true }),
      );
      nodes.push(head);
      d.plays = d.plays || [];
      nodes.push(objListField(i18n('card.plays'), d.plays,
        (card, p) => {
          p.name = toLangObj(p.name);
          p.role = toLangObj(p.role);
          card.append(
            langTextField(i18n('field.playName'), p.name, v => p.name = v),
            langTextField(i18n('field.role'), p.role, v => p.role = v),
            imgField(i18n('field.image'), p.image, v => p.image = v),
          );
        },
        () => ({ name: { vi: '', en: '', zh: '' }, role: { vi: '', en: '', zh: '' }, image: '' }),
      ));
      return nodes;
    },

    'experiences-tv'(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, i18n('card.tvDramas')),
        langTextField(i18n('field.heading'), (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField(i18n('field.subheading'), (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
        langTextField(i18n('field.intro'), (d.intro = toLangObj(d.intro)), v => d.intro = v, { textarea: true }),
      );
      nodes.push(head);
      d.shows = d.shows || [];
      nodes.push(objListField(i18n('card.shows'), d.shows,
        (card, s, i) => {
          const ref = toLangObj(s);
          d.shows[i] = ref;
          card.append(langTextField(i18n('field.showName'), ref, v => d.shows[d.shows.indexOf(ref)] = v));
        },
        () => ({ vi: '', en: '', zh: '' }),
      ));
      d.images = d.images || [];
      nodes.push(el('div', { class: 'card' },
        el('div', { class: 'card__title' }, i18n('card.photos')),
        imgListField(i18n('card.tvPhotos'), d.images, { onChange: v => d.images = v }),
      ));
      return nodes;
    },

    'film-categories'(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, i18n('card.film')),
        langTextField(i18n('field.heading'), (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField(i18n('field.subheading'), (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
      );
      nodes.push(head);
      d.categories = d.categories || [];
      nodes.push(objListField(i18n('card.categories'), d.categories,
        (card, c) => {
          c.title = toLangObj(c.title);
          c.works = c.works || [];
          card.append(
            textField(i18n('field.iconEmoji'), c.icon, v => c.icon = v),
            langTextField(i18n('field.categoryTitle'), c.title, v => c.title = v),
          );
          const worksList = objListField(i18n('card.works'), c.works,
            (wc, w, i) => {
              const ref = toLangObj(w);
              c.works[i] = ref;
              wc.append(langTextField(i18n('field.work'), ref, v => c.works[c.works.indexOf(ref)] = v));
            },
            () => ({ vi: '', en: '', zh: '' }),
          );
          card.append(worksList);
        },
        () => ({ icon: '🎬', title: { vi: '', en: '', zh: '' }, works: [] }),
      ));
      d.images = d.images || [];
      nodes.push(el('div', { class: 'card' },
        el('div', { class: 'card__title' }, i18n('card.photos')),
        imgListField(i18n('card.filmStills'), d.images, { onChange: v => d.images = v }),
      ));
      return nodes;
    },

    media(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, i18n('card.press')),
        langTextField(i18n('field.heading'), (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField(i18n('field.subheading'), (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
      );
      nodes.push(head);
      d.mentions = d.mentions || [];
      nodes.push(objListField(i18n('card.mentions'), d.mentions,
        (card, m) => {
          m.play = toLangObj(m.play);
          m.links = m.links || [];
          card.append(
            langTextField(i18n('field.play'), m.play, v => m.play = v),
            imgField(i18n('field.poster'), m.poster, v => m.poster = v),
          );
          const linksCard = el('div', { class: 'card' });
          linksCard.append(el('div', { class: 'card__title' },
            el('span', {}, i18n('card.links')),
            el('button', { class: 'btn--xs', onclick: () => { m.links.push(''); renderEditor(); dirty(); } }, i18n('action.add')),
          ));
          const listEl = el('div', { class: 'strlist' });
          m.links.forEach((lk, i) => {
            const row = el('div', { class: 'strlist__row' });
            row.append(
              el('input', {
                class: 'input', value: lk, placeholder: i18n('field.placeholder.url'),
                oninput: e => { m.links[i] = e.target.value; dirty(); },
              }),
              el('button', {
                class: 'btn--xs btn--danger',
                onclick: () => { m.links.splice(i, 1); renderEditor(); dirty(); },
              }, '×'),
            );
            listEl.append(row);
          });
          linksCard.append(listEl);
          card.append(linksCard);
        },
        () => ({ play: { vi: '', en: '', zh: '' }, poster: '', links: [] }),
      ));
      return nodes;
    },

    contact(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, i18n('card.contact')),
        langTextField(i18n('field.heading'), (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField(i18n('field.subheading'), (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
        imgField(i18n('field.photo'), d.image, v => d.image = v),
      );
      nodes.push(head);
      d.entries = d.entries || [];
      nodes.push(objListField(i18n('card.entries'), d.entries,
        (card, e) => {
          e.label = toLangObj(e.label);
          e.value = toLangObj(e.value);
          card.append(
            textField(i18n('field.iconType'),
              e.icon, v => e.icon = v),
            langTextField(i18n('field.label'), e.label, v => e.label = v),
            langTextField(i18n('field.value'), e.value, v => e.value = v),
            textField(i18n('field.linkHref'), e.href, v => e.href = v),
          );
        },
        () => ({ icon: 'email', label: { vi: '', en: '', zh: '' }, value: { vi: '', en: '', zh: '' }, href: '' }),
      ));
      return nodes;
    },

    thankyou(d) {
      const nodes = [];
      const head = el('div', { class: 'card' });
      head.append(
        el('div', { class: 'card__title' }, i18n('card.thankyou')),
        langTextField(i18n('field.heading'), (d.heading = toLangObj(d.heading)), v => d.heading = v),
        langTextField(i18n('field.subheading'), (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
      );
      nodes.push(head);
      d.images = d.images || [];
      nodes.push(el('div', { class: 'card' },
        el('div', { class: 'card__title' }, i18n('card.photos')),
        imgListField(i18n('card.photos'), d.images, { onChange: v => d.images = v }),
      ));
      return nodes;
    },
  };

  function infoEditor(d) {
    const nodes = [];
    const head = el('div', { class: 'card' });
    head.append(
      el('div', { class: 'card__title' }, i18n('card.personal')),
      langTextField(i18n('field.heading'), (d.heading = toLangObj(d.heading)), v => d.heading = v),
      langTextField(i18n('field.subheading'), (d.subheading = toLangObj(d.subheading)), v => d.subheading = v),
      imgField(i18n('field.photo'), d.image, v => d.image = v),
    );
    nodes.push(head);
    d.fields = d.fields || [];
    nodes.push(objListField(i18n('card.fields'), d.fields,
      (card, f) => {
        f.label = toLangObj(f.label || { vi: f.label_vi, en: f.label_en });
        f.value = toLangObj(f.value);
        delete f.label_vi; delete f.label_en;
        card.append(
          langTextField(i18n('field.label'), f.label, v => f.label = v),
          langTextField(i18n('field.value'), f.value, v => f.value = v),
        );
      },
      () => ({ label: { vi: '', en: '', zh: '' }, value: { vi: '', en: '', zh: '' } }),
    ));
    return nodes;
  }

  function bodyInfoEditor(d) {
    const nodes = infoEditor(d);
    d.images = d.images || [];
    nodes.push(el('div', { class: 'card' },
      el('div', { class: 'card__title' }, i18n('card.photos')),
      imgListField(i18n('card.bodyPhotos'), d.images, { onChange: v => d.images = v }),
    ));
    return nodes;
  }

  // ============================================================== IMAGE PICKER
  function openPicker(ctx) {
    state.pickerContext = ctx;
    loadImages().then(() => {
      renderPicker();
      $('#img-picker').hidden = false;
    });
  }
  function closePicker() {
    state.pickerContext = null;
    $('#img-picker').hidden = true;
  }
  function renderPicker() {
    const grid = $('#picker-grid');
    grid.innerHTML = '';
    if (!state.images.length) {
      grid.append(el('div', { class: 'editor__empty' },
        i18n('picker.empty')));
    }
    state.images.forEach(img => {
      const card = el('div', { class: 'pick-card' });
      card.innerHTML = `<img src="images/${esc(img.name)}" alt=""/>
        <div class="pick-card__name">${esc(img.name)}</div>`;
      card.append(el('button', {
        class: 'pick-card__del',
        onclick: async e => {
          e.stopPropagation();
          if (!confirm(i18n('picker.confirmDelete', { name: img.name }))) return;
          try { await deleteImage(img.name); } catch (err) { toast(err.message, 'err'); return; }
          await loadImages(); renderPicker();
        },
      }, '×'));
      card.onclick = () => {
        if (state.pickerContext?.multi) {
          state.pickerContext.set([img.name]);
          // keep open; user can add more and then close
        } else {
          state.pickerContext?.set?.(img.name);
          closePicker();
        }
      };
      grid.append(card);
    });
  }

  // ============================================================== WIRE UP
  function wireControls() {
    // ---------- Top toolbar --------------------------------------------
    // Always-visible language segmented
    $$('.lang-seg__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.lang === state.lang) return;
        state.lang = btn.dataset.lang;
        state.content.meta = state.content.meta || {};
        state.content.meta.default_lang = state.lang;
        applyMetaToControls();
        renderCatList();
        renderEditor();
        renderPreview();
        dirty();
      });
    });

    // Theme / Typography dock (toggle pinned panel)
    const toolbarStyle = $('#toolbar-style');
    if (toolbarStyle) toolbarStyle.addEventListener('click', toggleStyleModal);

    // Theme chips inside style modal
    $$('#theme-chips .theme-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        state.theme = chip.dataset.theme;
        state.content.meta = state.content.meta || {};
        state.content.meta.default_theme = state.theme;
        applyMetaToControls();
        dirty();
      });
    });

    // Reset buttons
    const resetAll = $('#reset-theme-all');
    if (resetAll) resetAll.addEventListener('click', () => {
      delete state.themeOverrides[state.theme];
      state.content.meta = state.content.meta || {};
      state.content.meta.theme_overrides = state.themeOverrides;
      applyThemeOverrides();
      buildColorEditor();
      buildFontEditor();
      dirty();
      toast(i18n('toast.themeReset'));
    });
    const resetColors = $('#reset-theme-colors');
    if (resetColors) resetColors.addEventListener('click', () => {
      const ov = state.themeOverrides[state.theme];
      if (ov) {
        COLOR_VARS.forEach(v => delete ov[v.name]);
        if (!Object.keys(ov).length) delete state.themeOverrides[state.theme];
        state.content.meta = state.content.meta || {};
        state.content.meta.theme_overrides = state.themeOverrides;
      }
      applyThemeOverrides();
      buildColorEditor();
      dirty();
      toast(i18n('toast.colorsReset'));
    });
    const resetFonts = $('#reset-theme-fonts');
    if (resetFonts) resetFonts.addEventListener('click', () => {
      const ov = state.themeOverrides[state.theme];
      if (ov) {
        FONT_VARS.forEach(v => delete ov[v.name]);
        if (!Object.keys(ov).length) delete state.themeOverrides[state.theme];
        state.content.meta = state.content.meta || {};
        state.content.meta.theme_overrides = state.themeOverrides;
      }
      applyThemeOverrides();
      buildFontEditor();
      dirty();
      toast(i18n('toast.fontsReset'));
    });

    // Close docked style panel
    const styleClose = $('#style-dock-close');
    if (styleClose) styleClose.addEventListener('click', closeStyleModal);

    // Google Font loader
    const gfLoad = $('#gf-load');
    if (gfLoad) gfLoad.addEventListener('click', () => {
      const input = $('#gf-family');
      const family = (input && input.value || '').trim();
      if (!family) { toast(i18n('toast.fontEnterName'), 'err'); return; }
      if (loadGoogleFont(family)) {
        if (input) input.value = '';
        buildFontEditor();
        dirty();
        toast(i18n('toast.fontLoaded', { family }));
      }
    });

    // Custom font upload
    const fontUpload = $('#font-upload');
    if (fontUpload) fontUpload.addEventListener('change', async e => {
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      if (!files.length) return;
      const famIn = $('#font-upload-family');
      const familyBase = (famIn && famIn.value || '').trim();
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const family = familyBase
          ? (files.length > 1 ? `${familyBase} ${i + 1}` : familyBase)
          : f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
        try { await uploadCustomFont(f, family); }
        catch (err) { toast(i18n('toast.uploadFailed', { msg: err.message }), 'err'); }
      }
      if (famIn) famIn.value = '';
      await loadCustomFonts();
      renderFontLibraryList();
      buildFontEditor();
      toast(i18n('toast.fontUploaded', { count: files.length }));
    });

    // Orientation toggle (toolbar)
    const tOrient = $('#toolbar-orient');
    if (tOrient) tOrient.addEventListener('click', () => {
      state.orientation = state.orientation === 'landscape' ? 'portrait' : 'landscape';
      state.content.meta = state.content.meta || {};
      state.content.meta.default_orientation = state.orientation;
      applyMetaToControls();
      dirty();
    });

    // Save / Print (toolbar)
    const tSave = $('#toolbar-save');
    if (tSave) tSave.addEventListener('click', saveContent);
    const tPrint = $('#toolbar-print');
    if (tPrint) tPrint.addEventListener('click', () => window.print());

    // Add category
    $('#add-cat-btn').addEventListener('click', () => {
      const type = prompt(i18n('prompt.sectionType'), 'about');
      if (!type) return;
      if (!templates[type]) { toast(i18n('toast.unknownType', { type }), 'err'); return; }
      const id = slug(prompt(i18n('prompt.sectionId'), type) || type) || 'new';
      if (state.content.categories.some(c => c.id === id)) {
        toast(i18n('toast.idInUse'), 'err'); return;
      }
      state.content.categories.push({ id, type, data: {} });
      state.selectedId = id;
      renderCatList(); renderEditor(); dirty();
    });

    // Image picker modal
    $('#img-picker-close').addEventListener('click', closePicker);
    $('#img-picker').addEventListener('click', e => {
      if (e.target.id === 'img-picker') closePicker();
    });
    $('#img-upload').addEventListener('change', async e => {
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      if (!files.length) return;
      for (const f of files) {
        try { await uploadImage(f); }
        catch (err) { toast(i18n('toast.uploadFailed', { msg: err.message }), 'err'); }
      }
      toast(i18n('toast.imagesUploaded', { count: files.length }));
      await loadImages();
      renderPicker();
    });

    // keyboard: ⌘/Ctrl+S and Escape
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveContent();
        return;
      }
      if (e.key === 'Escape') {
        const p = $('#img-picker');
        if (p && !p.hidden) { closePicker(); return; }
        const d = $('#style-dock');
        if (d && !d.hidden) { closeStyleModal(); return; }
      }
    });

    // warn on nav away w/ dirty
    window.addEventListener('beforeunload', e => {
      if (!state.isStatic && sig(state.content) !== state.originalSig) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  // ============================================================== BOOT
  async function init() {
    // Snapshot every theme's default CSS vars before we load content
    // (so we can revert-to-default cleanly later).
    try { captureThemeDefaults(); } catch (e) { console.warn('captureThemeDefaults failed', e); }

    try {
      await loadContent();
      await loadImages();
    } catch (e) { console.error(e); return; }

    // Restore any Google Fonts saved in content.meta
    const savedGF = (state.content && state.content.meta && state.content.meta.google_fonts) || [];
    if (Array.isArray(savedGF)) {
      savedGF.forEach(fam => loadGoogleFont(fam));
    }

    // Load custom font library (server-backed), then inject @font-face rules
    try { await loadCustomFonts(); } catch (e) { console.warn('loadCustomFonts failed', e); }

    wireControls();
    renderCatList();
    renderEditor();
    renderPreview();
    renderStatus();
  }

  init();
})();
