exports.handler = function(context, event, callback) {

    const data = [{
        id: 1,
        name:"Charles",
        age:23
    },{
        id:2,
        name:"Phil",
        age:30
    }];

    let index = event.index || 0;

    if(index == 0) return callback(null, data);

    let result = data.filter(p=> p.id == index);

    return callback(null, result);
}