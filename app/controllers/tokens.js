/**
 * Get a list of supported payment options in the format expected by /register
 */
getAcceptedPaymentDetails = () => {
  const examplePayment = [
    {
      chainId: 1,
      acceptedTokens: [{ ETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" }],
    },
    {
      chainId: 137,
      acceptedTokens: [
        { WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270" },
      ],
    },
  ];

  return examplePayment;
};

module.exports = { getAcceptedPaymentDetails };
