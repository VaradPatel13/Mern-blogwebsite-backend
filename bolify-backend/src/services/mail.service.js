const sendEmail = async (options) => {
    console.log("--- MOCK EMAIL SENT ---");
    console.log(`To: ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Message: ${options.message}`);
    console.log("-----------------------");
   
    return Promise.resolve();
};

export { sendEmail };
