import { useEffect } from 'react';

interface PayPalButtonProps {
  planId: string;
}

declare global {
  interface Window {
    paypal: any;
  }
}

export const PayPalButton = ({ planId }: PayPalButtonProps) => {
  useEffect(() => {
    // Check if script is already loaded
    if (!document.getElementById('paypal-sdk')) {
      const script = document.createElement('script');
      script.id = 'paypal-sdk';
      script.src = "https://www.paypal.com/sdk/js?client-id=AaNfWIGZVJnpWIl1uKrktd5mcjstvQc8-1mSAF20LY-ocQW8UhSh5dzsi_ghShwZ8nCxbqvl4xIjdD8j&vault=true&intent=subscription";
      script.setAttribute('data-sdk-integration-source', 'button-factory');
      script.async = true;
      script.onload = () => {
        renderButton();
      };
      document.body.appendChild(script);
    } else if (window.paypal) {
      renderButton();
    }

    function renderButton() {
      const containerId = `paypal-button-container-${planId}`;
      const container = document.getElementById(containerId);
      if (container && window.paypal) {
        // Clear container before rendering
        container.innerHTML = '';
        window.paypal.Buttons({
          style: {
            shape: 'rect',
            color: 'white',
            layout: 'vertical',
            label: 'subscribe'
          },
          createSubscription: function(data: any, actions: any) {
            return actions.subscription.create({
              plan_id: planId
            });
          },
          onApprove: function(data: any, actions: any) {
            alert(data.subscriptionID);
          }
        }).render(`#${containerId}`);
      }
    }
  }, [planId]);

  return (
    <div className="my-2">
      <div id={`paypal-button-container-${planId}`}></div>
    </div>
  );
};