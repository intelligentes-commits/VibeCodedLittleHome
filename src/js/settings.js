const force_redraw = (element) => {

    if (!element) return 
    element.classList.toggle('twt')
    var n = document.createTextNode(' ')
    var disp = element.style.display || 'block'
    element.appendChild(n)
    element.style.display = 'none'

    setTimeout(() => {
        element.style.display = disp
        n.parentNode.removeChild(n)
    },20)
}

const text_node = value => document.createTextNode(value)

const settings = {
    icons: {
        open: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M422.46-81.87q-23.2 0-40.29-15.35-17.08-15.35-20.08-38.04l-10-73.74q-11.09-4.78-22.79-11.08-11.69-6.29-21.26-13.09l-68.26 28q-21.45 9.24-43.15 1.87t-33.67-27.57l-58.05-100.87q-11.98-19.96-7.11-42.53 4.87-22.58 23.33-37.06l59.76-45.5q-.76-5.54-.76-10.58V-480q0-5.04.25-11.09.25-6.04 1.01-14.08l-59.26-43.76q-18.7-14.48-23.7-36.81-5-22.33 6.98-43.02l57.55-100.13q11.97-19.96 33.8-27.45 21.83-7.49 43.28 1.75l69.98 29q8.57-6.8 18.9-12.73 10.34-5.92 23.17-11.2l10-75.98q3-22.93 20.33-38.28 17.34-15.35 40.54-15.35h114.58q23.2 0 40.29 15.35 17.08 15.35 20.08 38.28l10 74.48q12.09 4.78 22.29 10.95 10.19 6.18 19.76 14.48l70.26-29q21.45-9.24 43.15-1.75t33.67 27.45l57.55 100.13q11.98 20.19 6.98 42.77-5 22.58-23.7 37.06l-62 45.76q.76 6.04.76 10.83V-480q0 7.54-.12 12.84-.12 5.29-1.14 10.83l61 44.76q18.7 14.48 23.7 37.06 5 22.58-6.98 42.77l-58.05 100.87q-11.97 19.96-33.8 27.45-21.83 7.49-43.28-1.75l-68.48-29q-8.07 6.3-17.4 11.84-9.34 5.55-24.17 12.83l-10 74.24q-3 22.69-20.08 38.04-17.09 15.35-40.29 15.35H422.46ZM478.78-345q56 0 95.5-39.5t39.5-95.5q0-56-39.5-95.5t-95.5-39.5q-56.26 0-95.63 39.5T343.78-480q0 56 39.37 95.5t95.63 39.5Z"/></svg>`,
        close: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-419.35 289.33-228.67Q276.65-216 259-216.25t-30.33-12.92q-12.17-12.68-11.92-30.08t12.42-29.58L419.35-480 229.17-671.17Q217-683.35 217-700.75t12.17-30.08q12.18-12.67 29.83-12.92t30.33 12.42L480-540.65l190.67-190.68Q683.35-744 701-743.75t30.33 12.92q12.17 12.68 11.92 30.08t-12.42 29.58L540.65-480l190.18 191.17Q743-276.65 743-259.25t-12.17 30.08Q718.65-216.5 701-216.25t-30.33-12.42L480-419.35Z"/></svg>`
    },
    theme: 'light',
    ai_provider: 'chatgpt',
    active_section: 'main',
    outside_handler: null,
    update_available: false,
    default_search_url: 'https://www.google.com/search?q={{{s}}}',
    styles: {
        'base_bg_color': [0, 360, 'Color', '', '210'],
        'base_bg_saturation': [0, 100, 'Saturation', '%', '58%'],
        'base_bg_color_range': [0, 180, 'Range', '', '36'],
        'base_bg_brightness': [0, 60, 'Brightness', '%', '12%'],
    },
    background_defaults: {
        mode: 'default',
        solid: '#e8e8e8',
        image: '',
        gradient_from: '#e8e8e8',
        gradient_to: '#b9c2ff',
        gradient_angle: '135deg',
    },
    read: (key, fallback) => {
        const value = getFromStorage(key)
        return value === null ? fallback : value
    },
    host: (url) => {
        try {
            return new URL(url).hostname.replace(/^www\./, '')
        } catch {
            return ''
        }
    },
    normalize_template_url: (value, fallback) => {
        const raw = (value || '').trim()
        if (raw === '') return fallback
        const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
            ? raw
            : `https://${raw}`
        if (withProtocol.includes('{{{s}}}')) return withProtocol
        return `${withProtocol}${withProtocol.includes('?') ? '&' : '?'}q={{{s}}}`
    },
    get_search_engine: () => {
        const url = settings.read('search_url', settings.default_search_url)
        const host = settings.host(url)
        return {
            name: host === 'google.com' ? 'Google' : host || 'Search',
            url,
        }
    },
    set_search_url: (value) => {
        setToStorage('search_url', settings.normalize_template_url(value, settings.default_search_url))
    },
    get_custom_bangs: () => {
        const value = settings.read('custom_bangs', [])
        return Array.isArray(value) ? value : []
    },
    save_custom_bangs: (bangs) => {
        setToStorage('custom_bangs', bangs)
    },
    add_custom_bang: ({tag, title, url}) => {
        const cleanTag = (tag || '').trim().replace(/^!/, '').toLowerCase()
        if (!cleanTag || !/^[a-z0-9._-]+$/i.test(cleanTag)) return false
        const cleanUrl = settings.normalize_template_url(url, '')
        if (!cleanUrl) return false
        const bang = {
            c: 'Custom',
            d: settings.host(cleanUrl),
            r: 0,
            s: (title || cleanTag).trim(),
            sc: 'Custom',
            t: cleanTag,
            u: cleanUrl,
            custom: true,
        }
        settings.save_custom_bangs([
            bang,
            ...settings.get_custom_bangs().filter(item => item.t !== cleanTag),
        ])
        return true
    },
    remove_custom_bang: (tag) => {
        settings.save_custom_bangs(settings.get_custom_bangs().filter(item => item.t !== tag))
    },
    set_theme: (theme) => {
        settings.theme = theme === 'dark' ? 'dark' : 'light'
        setToStorage('theme_mode', settings.theme)
        document.body.classList.toggle('theme-dark', settings.theme === 'dark')
        document.body.classList.toggle('theme-light', settings.theme !== 'dark')
        settings.apply_background()
    },
    set_ai_provider: (provider) => {
        const providers = window.LittleHomeAI?.providers || []
        settings.ai_provider = providers.some(item => item.key === provider)
            ? provider
            : 'chatgpt'
        setToStorage('ai_provider', settings.ai_provider)
    },
    set_toggle: (name, value) => {
        setToStorage(name, value)
        settings.apply_behavior()
    },
    apply_behavior: () => {
        document.body.classList.toggle('clock-disabled', settings.read('show_clock', true) === false)
        document.body.classList.toggle('no-animations', settings.read('enable_animations', true) === false)
    },
    set_style: (name, value) => {
        setToStorage(`theme_${name}`, value)
        const bg = document.querySelector('#background')
        bg.style.setProperty(`--${name}`, value)
    },
    set_background_mode: (mode) => {
        const safeMode = ['default', 'image', 'solid', 'gradient'].includes(mode)
            ? mode
            : settings.background_defaults.mode
        setToStorage('background_mode', safeMode)
        settings.apply_background()
    },
    set_background_value: (name, value) => {
        setToStorage(`background_${name}`, value)
        settings.apply_background()
    },
    apply_background: () => {
        const bg = document.querySelector('#background')
        if (!bg) return
        const storedMode = settings.read('background_mode', settings.background_defaults.mode)
        const mode = ['default', 'image', 'solid', 'gradient'].includes(storedMode)
            ? storedMode
            : settings.background_defaults.mode
        document.body.classList.remove('bg-default', 'bg-solid', 'bg-image', 'bg-gradient')
        document.body.classList.add(`bg-${mode}`)
        bg.style.setProperty('--solid_bg_color', settings.read('background_solid', settings.background_defaults.solid))
        bg.style.setProperty('--custom_gradient_from', settings.read('background_gradient_from', settings.background_defaults.gradient_from))
        bg.style.setProperty('--custom_gradient_to', settings.read('background_gradient_to', settings.background_defaults.gradient_to))
        bg.style.setProperty('--custom_gradient_angle', settings.read('background_gradient_angle', settings.background_defaults.gradient_angle))
        const image = settings.read('background_image', settings.background_defaults.image)
        bg.style.setProperty('--custom_bg_image', image ? `url("${image.replace(/"/g, '\\"')}")` : 'none')
    },
    init: async () => {
        document.querySelector('#settingsbutton').innerHTML = settings.icons.open
        document.querySelector('#settingsbutton').onclick = () => settings.open()

        settings.set_theme(getFromStorage('theme_mode') || 'light')
        settings.set_ai_provider(getFromStorage('ai_provider') || 'chatgpt')
        settings.apply_behavior()
        settings.apply_background()

        Object.keys(settings.styles).map(
            key => {
                const v = getFromStorage(`theme_${key}`)
                settings.set_style(key, v || settings.styles[key][4])
            }
        )

        window.LittleHomeSettings = {
            getSearchEngine: settings.get_search_engine,
            getCustomBangs: settings.get_custom_bangs,
        }
    },
    open: async () => {
        if (document.querySelector('#settingsui')) return
        const make_option = (className, selected, onClick, ...children) => $.button(
            {
                class: `${className} ${selected ? 'selected' : ''}`,
                type: 'button',
                onclick: onClick,
            },
            ...children,
        )
        const setting_section = (title, detail, ...children) => $.section(
            {class: 'settingsSection'},
            $.div(
                {class: 'settingsSectionHeader'},
                $.h3(title),
                $.p(detail),
            ),
            ...children,
        )
        const field = (label, control, detail = '') => {
            const children = [
                $.span({class: 'settingsFieldLabel'}, label),
                control,
            ]
            if (detail) children.push($.span({class: 'settingsFieldHint'}, detail))
            return $.label({class: 'settingsField'}, ...children)
        }
        const toggle = (label, detail, storageKey, fallback = true) => {
            const checked = settings.read(storageKey, fallback) !== false
            const props = {
                type: 'checkbox',
                onchange: event => settings.set_toggle(storageKey, event.target.checked),
            }
            if (checked) props.checked = 'checked'
            return $.label(
                {class: 'settingsToggle'},
                $.span(
                    $.span({class: 'settingsToggleTitle'}, label),
                    $.span({class: 'settingsToggleHint'}, detail),
                ),
                $.input(props),
            )
        }
        const range_control = key => {
            const d = settings.styles[key]
            const value = settings.read(`theme_${key}`, d[4])
            return field(
                d[2],
                $.input({
                    type: 'range',
                    min: d[0],
                    max: d[1],
                    value: parseInt(value),
                    oninput: event => settings.set_style(key, `${event.target.value}${d[3]}`),
                }),
            )
        }
        const theme_button = theme => make_option(
            'settingsChoice',
            settings.theme === theme,
            () => {
                settings.set_theme(theme)
                render_body()
            },
            theme === 'dark' ? 'sinya' : 'int',
        )
        const ai_provider_button = provider => make_option(
            'settingsChoice aiChoice',
            settings.ai_provider === provider.key,
            () => {
                settings.set_ai_provider(provider.key)
                render_body()
            },
            $.span({class: 'optionTitle'}, provider.s),
            $.span({class: 'optionMeta'}, new URL(provider.u).hostname.replace(/^www\./, '')),
        )
        const background_mode_button = (mode, label) => make_option(
            'settingsChoice',
            settings.read('background_mode', settings.background_defaults.mode) === mode,
            () => {
                settings.set_background_mode(mode)
                render_body()
            },
            label,
        )

        const render_main = () => {
            const engine = settings.get_search_engine()
            const input = $.input({
                type: 'text',
                value: engine.url,
                spellcheck: 'false',
                onchange: event => settings.set_search_url(event.target.value),
            })
            const items = [
                setting_section(
                    'Поиск',
                    'Основной поисковик без бенгов. Используй {{{s}}} как место запроса.',
                    field('URL поисковика', input, 'Если {{{s}}} не указан, параметр q добавится автоматически.'),
                ),
                setting_section(
                    'Поведение',
                    'Минимальные переключатели для главного экрана.',
                    toggle('Часы', 'Показывать часы и подсказку в режиме ожидания.', 'show_clock', true),
                    toggle('Анимации', 'Отключает переходы и фоновые анимации.', 'enable_animations', true),
                ),
            ]
            if (settings.update_available) {
                items.push($.button({class: 'settingsUpdateButton', type: 'button'}, 'Обновление доступно'))
            }
            return items
        }

        const render_bangs = () => {
            const tag = $.input({type: 'text', placeholder: 'ppx', spellcheck: 'false'})
            const title = $.input({type: 'text', placeholder: 'Perplexity', spellcheck: 'false'})
            const url = $.input({type: 'text', placeholder: 'https://example.com/search?q={{{s}}}', spellcheck: 'false'})
            const list = settings.get_custom_bangs()
            const items = list.length
                ? list.map(bang => $.div(
                    {class: 'customBangRow'},
                    $.span({class: 'customBangTag'}, `!${bang.t}`),
                    $.span({class: 'customBangTitle'}, text_node(bang.s)),
                    $.span({class: 'customBangHost'}, text_node(bang.d)),
                    $.button({
                        type: 'button',
                        class: 'customBangRemove',
                        onclick: () => {
                            settings.remove_custom_bang(bang.t)
                            render_body()
                        },
                    }, 'Remove'),
                ))
                : [$.p({class: 'emptyState'}, 'Кастомных бенгов пока нет.')]

            return [
                setting_section(
                    'Добавить бенг',
                    'Кастомные бенги показываются выше встроенных.',
                    $.div(
                        {class: 'bangForm'},
                        field('Бенг', tag),
                        field('Название', title),
                        field('URL', url, 'В URL можно использовать {{{s}}}.'),
                        $.button({
                            type: 'button',
                            class: 'settingsPrimaryButton',
                            onclick: () => {
                                if (settings.add_custom_bang({
                                    tag: tag.value,
                                    title: title.value,
                                    url: url.value,
                                })) render_body()
                            },
                        }, 'Добавить'),
                    ),
                ),
                setting_section(
                    'Твои бенги',
                    'Эти команды живут только в этой версии LittleHome.',
                    $.div({class: 'customBangList'}, ...items),
                ),
            ]
        }

        const render_customization = () => {
            const mode = settings.read('background_mode', settings.background_defaults.mode)
            const background_controls = [
                $.div(
                    {class: 'settingsChoiceGrid'},
                    background_mode_button('default', 'Default'),
                    background_mode_button('image', 'Image URL'),
                    background_mode_button('solid', 'Solid'),
                    background_mode_button('gradient', 'Gradient'),
                ),
            ]

            if (mode === 'default') {
                background_controls.push(...Object.keys(settings.styles).map(key => range_control(key)))
            }
            if (mode === 'image') {
                background_controls.push(field(
                    'Image / GIF URL',
                    $.input({
                        type: 'text',
                        value: settings.read('background_image', settings.background_defaults.image),
                        spellcheck: 'false',
                        onchange: event => settings.set_background_value('image', event.target.value),
                    }),
                ))
            }
            if (mode === 'solid') {
                background_controls.push(field(
                    'Color',
                    $.input({
                        type: 'color',
                        value: settings.read('background_solid', settings.background_defaults.solid),
                        oninput: event => settings.set_background_value('solid', event.target.value),
                    }),
                ))
            }
            if (mode === 'gradient') {
                background_controls.push(
                    field('From', $.input({
                        type: 'color',
                        value: settings.read('background_gradient_from', settings.background_defaults.gradient_from),
                        oninput: event => settings.set_background_value('gradient_from', event.target.value),
                    })),
                    field('To', $.input({
                        type: 'color',
                        value: settings.read('background_gradient_to', settings.background_defaults.gradient_to),
                        oninput: event => settings.set_background_value('gradient_to', event.target.value),
                    })),
                    field('Angle', $.input({
                        type: 'range',
                        min: 0,
                        max: 360,
                        value: parseInt(settings.read('background_gradient_angle', settings.background_defaults.gradient_angle)),
                        oninput: event => settings.set_background_value('gradient_angle', `${event.target.value}deg`),
                    })),
                )
            }

            return [
                setting_section(
                    'Пресеты',
                    'Базовые темы остаются быстрым выбором.',
                    $.div({class: 'settingsChoiceGrid'}, theme_button('light'), theme_button('dark')),
                ),
                setting_section(
                    'ИИ по умолчанию',
                    'Используется при входе в prompt-режим через Space.',
                    $.div(
                        {class: 'aiSwitch'},
                        ...(window.LittleHomeAI?.providers || []).map(provider => ai_provider_button(provider)),
                    ),
                ),
                $.div(
                    {class: 'settingsBottomEditors'},
                    setting_section(
                        'Основные цвета интерфейса',
                        'Пока завязано на пресеты int/sinya; отдельные цвета вынесем следующим слоем.',
                        $.span({class: 'settingsMuted'}, 'Готово место под редактор UI-токенов.'),
                    ),
                    setting_section(
                        'Фон',
                        'Default, изображение/GIF, solid color или gradient.',
                        ...background_controls,
                    ),
                ),
            ]
        }

        const sections = {
            main: {label: 'Основное', detail: 'поиск и поведение', render: render_main},
            bangs: {label: 'Бенги', detail: 'твои команды', render: render_bangs},
            customize: {label: 'Кастомизация', detail: 'темы и фон', render: render_customization},
        }
        const body = $.div({class: 'settingsPanelBody'})
        const nav = $.nav(
            {class: 'settingsNav'},
            ...Object.entries(sections).map(([key, item]) => $.button(
                {
                    class: `settingsNavItem ${settings.active_section === key ? 'selected' : ''}`,
                    type: 'button',
                    onclick: () => {
                        settings.active_section = key
                        render_body()
                    },
                    'data-section': key,
                },
                $.span({class: 'settingsNavTitle'}, item.label),
                $.span({class: 'settingsNavDetail'}, item.detail),
            )),
        )
        const ui = $.div(
            {id: 'settingsui'},
            $.div(
                {class: 'settingsPanelHeader'},
                $.div(
                    $.h2('Settings'),
                    $.p('LittleHome'),
                ),
                $.button(
                    {
                        class: 'settingsClose',
                        type: 'button',
                        onclick: () => settings.close(),
                        'aria-label': 'Close settings',
                    },
                    settings.icons.close,
                ),
            ),
            nav,
            body,
        )
        const render_body = () => {
            nav.querySelectorAll('.settingsNavItem').forEach(item => {
                item.classList.toggle('selected', item.dataset.section === settings.active_section)
            })
            body.innerHTML = ''
            sections[settings.active_section].render().forEach(node => body.appendChild(node))
        }
        render_body()
        document.body.appendChild(ui)
        requestAnimationFrame(() => ui.classList.add('open'))
        document.querySelector('#settingsbutton').innerHTML = settings.icons.close
        document.querySelector('#settingsbutton').onclick = () => settings.close()
        settings.outside_handler = event => {
            if (
                ui.contains(event.target) ||
                document.querySelector('#settingsbutton').contains(event.target)
            ) return
            settings.close()
        }
        setTimeout(() => document.addEventListener('mousedown', settings.outside_handler), 0)
    },
    close: async () => {
        const ui = document.querySelector('#settingsui')
        if (!ui) return
        if (settings.outside_handler) {
            document.removeEventListener('mousedown', settings.outside_handler)
            settings.outside_handler = null
        }
        ui.classList.remove('open')
        setTimeout(() => {
            if (ui.parentNode) ui.remove()
            settings.init()
        }, 220)
    }
}
