export interface CheckoutAutofillParams {
  siteUrl: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  orderNotes: string;
}

/**
 * Generates WebView autofill script for WooCommerce checkout billing fields.
 * Never ticks terms/consent checkboxes and restricts cart redirects to Env.SITE_URL.
 */
export function buildCheckoutAutofillScript({
  siteUrl,
  firstName,
  lastName,
  email,
  phone,
  city,
  address,
  orderNotes,
}: CheckoutAutofillParams): string {
  return `
    (function() {
      function runAutofill() {
        try {
          if (window.location.pathname.includes('/cart')) {
            window.location.replace(${JSON.stringify(`${siteUrl}/checkout/`)});
            return;
          }

          if (window.location.pathname.includes('/checkout')) {
            function setField(id, val) {
              if (!val) return;
              var el = document.getElementById(id);
              if (el && (!el.value || el.value.trim() === '')) {
                el.value = val;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }

            setField('billing_first_name', ${JSON.stringify(firstName.trim())});
            setField('billing_last_name', ${JSON.stringify(lastName.trim())});
            setField('billing_email', ${JSON.stringify(email.trim())});
            setField('billing_phone', ${JSON.stringify(phone.trim())});
            if (${JSON.stringify(city.trim())}) {
              setField('billing_city', ${JSON.stringify(city.trim())});
            }
            if (${JSON.stringify(address.trim())}) {
              setField('billing_address_1', ${JSON.stringify(address.trim())});
            }
            if (${JSON.stringify(orderNotes.trim())}) {
              setField('order_comments', ${JSON.stringify(orderNotes.trim())});
            }

            var fieldsToTrack = ['billing_first_name', 'billing_last_name', 'billing_email', 'billing_phone', 'billing_city', 'billing_address_1'];
            fieldsToTrack.forEach(function(fieldId) {
              var inputEl = document.getElementById(fieldId);
              if (inputEl && !inputEl.dataset.tsWatched) {
                inputEl.dataset.tsWatched = 'true';
                var changeHandler = function() {
                  try {
                    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'CHECKOUT_FIELD_AUTO_DETECT',
                        field: fieldId,
                        value: inputEl.value
                      }));
                    }
                  } catch(e) {}
                };
                inputEl.addEventListener('change', changeHandler);
                inputEl.addEventListener('blur', changeHandler);
              }
            });

            if (window.jQuery && !window.tsJqueryHooked) {
              window.tsJqueryHooked = true;
              window.jQuery(document.body).on('updated_checkout', function() {
                setTimeout(runAutofill, 80);
              });
            }
          }
        } catch (err) {
          console.error('TS Autofill error:', err);
        }
      }

      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        runAutofill();
      } else {
        document.addEventListener('DOMContentLoaded', runAutofill);
      }
      setTimeout(runAutofill, 400);
      setTimeout(runAutofill, 1200);
    })();
    true;
  `;
}
