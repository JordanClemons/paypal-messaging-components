import objectEntries from 'core-js-pure/stable/object/entries';
import arrayFrom from 'core-js-pure/stable/array/from';
import { isIosWebview, isAndroidWebview } from '@krakenjs/belter/src';
import { request, memoize, ppDebug } from '../../../../utils';

export const getContent = memoize(
    ({
        currency,
        amount,
        payerId,
        clientId,
        merchantId,
        customerId,
        buyerCountry,
        language,
        ignoreCache,
        deviceID,
        version,
        env,
        stageTag,
        integrationType,
        channel,
        contextualComponents,
        devTouchpoint,
        disableSetCookie,
        features,
        buttonSessionId
    }) => {
        const query = objectEntries({
            currency,
            amount,
            payer_id: payerId,
            client_id: clientId,
            merchant_id: merchantId,
            customer_id: customerId,
            buyer_country: buyerCountry,
            language,
            ignore_cache: ignoreCache,
            deviceID,
            version,
            env,
            stageTag,
            integrationType,
            channel,
            contextual_components: contextualComponents,
            devTouchpoint,
            disableSetCookie,
            features,
            buttonSessionId
        })
            .filter(([, val]) => Boolean(val))
            .reduce(
                (acc, [key, val]) =>
                    `${acc}&${key}=${encodeURIComponent(typeof val === 'object' ? JSON.stringify(val) : val)}`,
                ''
            )
            .slice(1);

        ppDebug('Updating modal with new props...', { inZoid: true });

        return request('GET', `${window.location.origin}/credit-presentment/modalContent?${query}`).then(
            ({ data }) => data
        );
    }
);

/**
 * Checks if target is lander. If true, lander-specific styles will be used.
 * @returns boolean
 */
export const isLander = __MESSAGES__.__TARGET__ === 'LANDER';
const { userAgent } = window.navigator;
export const isIframe = window.top !== window || isIosWebview(userAgent) || isAndroidWebview(userAgent);

export function setupTabTrap() {
    // Disable tab trap functionality for modal lander
    if (isLander) {
        return;
    }

    const focusableElementsString =
        "a[href], button, input, textarea, select, details, [tabindex]:not([tabindex='-1'])";

    function trapTabKey(e) {
        // Check for TAB key press
        if (e.keyCode === 9 && !document.querySelector('.modal-closed')) {
            const tabArray = arrayFrom(document.querySelectorAll(focusableElementsString)).filter(
                node => window.getComputedStyle(node).visibility === 'visible'
            );
            // SHIFT + TAB
            if (e.shiftKey && document.activeElement === tabArray[0]) {
                e.preventDefault();
                tabArray[tabArray.length - 1].focus();
            } else if (document.activeElement === tabArray[tabArray.length - 1]) {
                e.preventDefault();
                tabArray[0].focus();
            }
            // auto scroll into view for focused element
            setTimeout(() => {
                document.activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 0);
        }
    }
    window.addEventListener('keydown', trapTabKey);
}

export function formatDateByCountry(country) {
    const currentDate = new Date();
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    if (country === 'US') {
        return currentDate.toLocaleDateString('en-US', options);
    }
    return currentDate.toLocaleDateString('en-GB', options);
}
