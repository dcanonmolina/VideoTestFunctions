
exports.handler =async function(context, event, callback) {
    // Make sure the necessary Sync names are defined.
    const syncServiceSid = context.TWILIO_SYNC_SERVICE_SID || 'default';
    const syncListMap = context.SYNC_LIST_MAP || 'serverless-sync-demo';
    // You can quickly access a Twilio Sync client via Runtime.getSync()
    const syncClient = Runtime.getSync({ serviceName: syncServiceSid });

    let action = event.action;
    let profileName = event.ProfileName;
    
    let response = { exists: false, city:event.city, food:event.food};
    try {
      // Ensure that the Sync List exists before we try to add a new message to it
      await getOrCreateResource(syncClient.maps, syncListMap);
      // Append the incoming message to the list
      let profileNewItem = await getOrCreateMapItem(syncClient.maps, syncListMap,profileName);
  
      if(action=="READ"){

        response.exists = profileNewItem.data.food?true:false;
        response.food = profileNewItem.data.food;
        response.city=profileNewItem.data.city;

      }
      else{
        response.exists = true;
        await syncClient.maps(syncListMap).syncMapItems(profileName).update({
            data: {
                food:response.food ,
                city:response.city
            },
          });
      }

      return callback(null, response);
    } catch (error) {
      // Persist the error to your logs so you can debug
      console.error(error);
 
      return callback(error);
    }
  
    
  };
  
  const  getOrCreateMapItem = async (maps, syncListMap,profileName)=>{
    try{
      return await maps(syncListMap).syncMapItems(profileName).fetch(); 
    }
    catch{
      let item= {key:profileName, data:{}}
      await maps(syncListMap).syncMapItems.create(item);
      return item;
    }
  
  }
  
  const getOrCreateResource = async (resource, name, options = {}) => {
    try {
      // Does this resource (Sync Document, List, or Map) exist already? Return it
      return await resource(name).fetch();
    } catch (err) {
      // It doesn't exist, create a new one with the given name and return it
      options.uniqueName = name;
      return resource.create(options);
    }
  };