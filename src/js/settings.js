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
const settings = {
    icons: {
        open: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M422.46-81.87q-23.2 0-40.29-15.35-17.08-15.35-20.08-38.04l-10-73.74q-11.09-4.78-22.79-11.08-11.69-6.29-21.26-13.09l-68.26 28q-21.45 9.24-43.15 1.87t-33.67-27.57l-58.05-100.87q-11.98-19.96-7.11-42.53 4.87-22.58 23.33-37.06l59.76-45.5q-.76-5.54-.76-10.58V-480q0-5.04.25-11.09.25-6.04 1.01-14.08l-59.26-43.76q-18.7-14.48-23.7-36.81-5-22.33 6.98-43.02l57.55-100.13q11.97-19.96 33.8-27.45 21.83-7.49 43.28 1.75l69.98 29q8.57-6.8 18.9-12.73 10.34-5.92 23.17-11.2l10-75.98q3-22.93 20.33-38.28 17.34-15.35 40.54-15.35h114.58q23.2 0 40.29 15.35 17.08 15.35 20.08 38.28l10 74.48q12.09 4.78 22.29 10.95 10.19 6.18 19.76 14.48l70.26-29q21.45-9.24 43.15-1.75t33.67 27.45l57.55 100.13q11.98 20.19 6.98 42.77-5 22.58-23.7 37.06l-62 45.76q.76 6.04.76 10.83V-480q0 7.54-.12 12.84-.12 5.29-1.14 10.83l61 44.76q18.7 14.48 23.7 37.06 5 22.58-6.98 42.77l-58.05 100.87q-11.97 19.96-33.8 27.45-21.83 7.49-43.28-1.75l-68.48-29q-8.07 6.3-17.4 11.84-9.34 5.55-24.17 12.83l-10 74.24q-3 22.69-20.08 38.04-17.09 15.35-40.29 15.35H422.46ZM478.78-345q56 0 95.5-39.5t39.5-95.5q0-56-39.5-95.5t-95.5-39.5q-56.26 0-95.63 39.5T343.78-480q0 56 39.37 95.5t95.63 39.5Z"/></svg>`,
        close: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-419.35 289.33-228.67Q276.65-216 259-216.25t-30.33-12.92q-12.17-12.68-11.92-30.08t12.42-29.58L419.35-480 229.17-671.17Q217-683.35 217-700.75t12.17-30.08q12.18-12.67 29.83-12.92t30.33 12.42L480-540.65l190.67-190.68Q683.35-744 701-743.75t30.33 12.92q12.17 12.68 11.92 30.08t-12.42 29.58L540.65-480l190.18 191.17Q743-276.65 743-259.25t-12.17 30.08Q718.65-216.5 701-216.25t-30.33-12.42L480-419.35Z"/></svg>`
    },
    theme: 'light',
    ai_provider: 'chatgpt',
    outside_handler: null,
    styles: {
        'base_bg_color': [0, 360, 'Color', ''],
        'base_bg_saturation': [0, 100, 'Saturation', '%'],
        'base_bg_color_range': [0, 180, 'Range', ''],
    },
    set_theme: (theme) => {
        settings.theme = theme === 'dark' ? 'dark' : 'light'
        setToStorage('theme_mode', settings.theme)
        document.body.classList.toggle('theme-dark', settings.theme === 'dark')
        document.body.classList.toggle('theme-light', settings.theme !== 'dark')
    },
    set_ai_provider: (provider) => {
        const providers = window.LittleHomeAI?.providers || []
        settings.ai_provider = providers.some(item => item.key === provider)
            ? provider
            : 'chatgpt'
        setToStorage('ai_provider', settings.ai_provider)
    },
    set_style: (name, value) => {
        setToStorage(`theme_${name}`, value)
        const bg = document.querySelector('#background')
        bg.style.setProperty(`--${name}`, value)
        bg.style.display = 'none'
        setTimeout(async () => {
            bg.style.display = 'block'
        },)
    },
    init: async () => {
        document.querySelector('#settingsbutton').innerHTML = settings.icons.open
        document.querySelector('#settingsbutton').onclick = () => settings.open()

        settings.set_theme(getFromStorage('theme_mode') || 'light')
        settings.set_ai_provider(getFromStorage('ai_provider') || 'chatgpt')

        Object.keys(settings.styles).map(
            key => {
                const v = getFromStorage(`theme_${key}`)
                if (!v) settings.set_style(key, `11${settings.styles[key][3]}`)
                else settings.set_style(key, v)
            }
        )
    },
    open: async () => {
        if (document.querySelector('#settingsui')) return
        const ret = name => parseInt(document.querySelector('#background').style.getPropertyValue(`--${name}`).trim().replace('%', ''))
        const setter = (name, trail = '') => (e) => settings.set_style(name, `${e.target.value}${trail}`)
        const state = (name, trail = '') => {return {value: ret(name), oninput: setter(name, trail)}}
        const settingSection = (title, detail, ...children) => $.section(
            {class: 'settingsSection'},
            $.div(
                {class: 'settingsSectionHeader'},
                $.h3(title),
                $.p(detail),
            ),
            ...children,
        )
        const themeButton = theme => $.button(
            {
                class: `themeOption ${settings.theme === theme ? 'selected' : ''}`,
                type: 'button',
                onclick: () => {
                    settings.set_theme(theme)
                    document.querySelectorAll('.themeOption').forEach(option => option.classList.remove('selected'))
                    document.querySelector(`.themeOption[data-theme="${theme}"]`).classList.add('selected')
                },
                'data-theme': theme,
            },
            theme === 'dark' ? 'sinya' : 'int'
        )
        const aiProviderButton = provider => $.button(
            {
                class: `aiOption ${settings.ai_provider === provider.key ? 'selected' : ''}`,
                type: 'button',
                onclick: () => {
                    settings.set_ai_provider(provider.key)
                    document.querySelectorAll('.aiOption').forEach(option => option.classList.remove('selected'))
                    document.querySelector(`.aiOption[data-provider="${provider.key}"]`).classList.add('selected')
                },
                'data-provider': provider.key,
            },
            $.span({class: 'optionTitle'}, provider.s),
            $.span({class: 'optionMeta'}, new URL(provider.u).hostname.replace(/^www\./, '')),
        )
        const rangeControl = key => {
            const d = settings.styles[key]
            return $.label(
                {class: 'rangeControl'},
                $.span({class: 'rangeLabel'}, d[2]),
                $.input({type: 'range', min: d[0], max: d[1], ...state(key, d[3])})
            )
        }
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
            $.div(
                {class: 'settingsPanelBody'},
                settingSection(
                    'Theme',
                    'Choose the page surface.',
                    $.div(
                        {class: 'themeSwitch'},
                        themeButton('light'),
                        themeButton('dark'),
                    ),
                ),
                settingSection(
                    'AI provider',
                    'Used when search starts with Space.',
                    $.div(
                        {class: 'aiSwitch'},
                        ...(window.LittleHomeAI?.providers || []).map(provider => aiProviderButton(provider)),
                    ),
                ),
                settingSection(
                    'Gradient',
                    'Tweak the sinya background.',
                    ...Object.keys(settings.styles).map(key => rangeControl(key)),
                ),
            ),
        )
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
