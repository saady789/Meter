import Mnee from "@mnee/ts-sdk";

const config = {
  environment: "sandbox", // or 'production'
  apiKey: "2f34b06c0a17aa40f2cce70ace9db3e6",
};

const mnee = new Mnee(config);
const res = await mnee.config();
//console.log("MNEE Configuration:", res);
const address = "13dX5yfZfi2kWjGS8VeGApjuWWENJhkTUp";
const balance = await mnee.balance(address);
console.log(`Balance for ${address}:`, balance);

// mnee.config().then(mneeConfig => {
//   console.log('MNEE Configuration:', mneeConfig);
// });
//  Wallet Details                               │
//    │                                                   │
//    │   • Name: saad                                    │
//    │   • Environment: sandbox                          │
//    │   • Address: 13dX5yfZfi2kWjGS8VeGApjuWWENJhkTUp   │
//    │                                                   │
//    │   ✓ This wallet is now active
