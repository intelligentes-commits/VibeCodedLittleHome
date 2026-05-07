// Focus bootstrap for the extension new-tab page.
// Chrome keeps the first focus in the omnibox on overridden NTP pages.
// Tabs++ bypasses this by replacing the initial new-tab URL once, then focusing
// the page input repeatedly during the first seconds of the second load.
(() => {
    const params = new URLSearchParams(window.location.search)
    const alreadyFocusedLoad = params.get('focused') === 'true'

    if (!alreadyFocusedLoad) {
        params.set('focused', 'true')
        window.location.replace(`index.html?${params.toString()}${window.location.hash}`)
        return
    }

    let input = null
    let focusInterval = null
    let attempts = 0
    let isNavigating = false

    const focusTarget = () => {
        if (isNavigating || document.visibilityState === 'hidden') return

        input = input || document.getElementById('search_ddd')
        if (!input) return

        window.focus()

        // Do not focus <body> while the search input is already active.
        // Blurring a text input after a value has changed fires the native
        // "change" event in Chrome, and this extension used that event to
        // navigate to search results. Tabs++ can safely call body.focus()
        // because its search flow is not bound to the input's blur/change event.
        if (document.activeElement !== input) {
            input.focus({ preventScroll: true })
        }
    }

    const stopFocusLoop = () => {
        if (focusInterval) {
            clearInterval(focusInterval)
            focusInterval = null
        }
    }

    window.__littleHomeStopNtpFocus = () => {
        isNavigating = true
        stopFocusLoop()
    }

    window.addEventListener('DOMContentLoaded', () => {
        input = document.getElementById('search_ddd')
        if (!input) return

        input.value = ''
        focusTarget()

        focusInterval = setInterval(() => {
            focusTarget()
            attempts += 1

            if (attempts > 50) stopFocusLoop()
        }, 50)

        input.addEventListener('focusout', (event) => {
            if (isNavigating || document.visibilityState === 'hidden') return

            // relatedTarget === null is the usual sign that focus left the page
            // and went into the browser UI / omnibox.
            if (!event.relatedTarget) {
                setTimeout(focusTarget, 50)
            }
        })

        window.addEventListener('focus', () => {
            if (!isNavigating) focusTarget()
        })

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !isNavigating) {
                focusTarget()
            }
        })

        ;['mousedown', 'touchstart'].forEach((type) => {
            document.addEventListener(type, (event) => {
                if (isNavigating || !input || event.target === input) return
                if (!event.target.closest('a') && !event.target.closest('button') && !event.target.closest('input')) {
                    input.focus()
                }
            })
        })
    })
})()
