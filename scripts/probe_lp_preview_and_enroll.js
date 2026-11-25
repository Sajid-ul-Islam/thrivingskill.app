async function main() {
  // Check LearnPress preview lesson 86356 unauthenticated
  const l86356 = await fetch('https://thrivingskill.com/wp-json/learnpress/v1/lessons/86356');
  console.log('LP /lessons/86356 (preview=true) unauth status:', l86356.status, (await l86356.text()).slice(0, 250));

  // Check staging companion /lessons/86358 (if plugin v1.1.1 is live on staging)
  const s86358 = await fetch('https://staging.thrivingskill.com/wp-json/thrivingskill/v1/lessons/86358');
  console.log('Staging companion /lessons/86358 unauth status:', s86358.status, (await s86358.text()).slice(0, 250));

  // Check OPTIONS on learnpress/v1/courses/enroll and wc/store/v1
  const optRes = await fetch('https://thrivingskill.com/wp-json/learnpress/v1/courses/enroll', { method: 'OPTIONS' });
  console.log('LP /courses/enroll OPTIONS:', optRes.status, (await optRes.text()).slice(0, 300));
}
main().catch(console.error);
