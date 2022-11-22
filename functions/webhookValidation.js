
exports.handler = function(context, event, callback) {
    const valueValidation = context.HEADER_AUTH_VAL;
    const twiml = new Twilio.twiml.MessagingResponse();
    const authHeader = event.request.headers.authorization; 

    if(!authHeader) {
        twiml.message('Please send your credentials');
        return callback(null, twiml);
    }

    const [authType, credentials] = authHeader.split(' ');

    console.log('header ', authHeader);

    if(valueValidation!=credentials){
        twiml.message('You are not authorized');
        return callback(null, twiml);
    }
        
    twiml.message('Thank you for your comments');
    return callback(null, twiml);
}