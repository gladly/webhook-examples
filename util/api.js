const { gladlyApiRequest } = require('./api-request');

//https://developer.gladly.com/rest/#operation/createCustomer
module.exports.getCustomerById = function(id) {
  return gladlyApiRequest('GET', `/api/v1/customer-profiles/${id}`);
}

//https://developer.gladly.com/rest/#operation/updateCustomer
module.exports.updateCustomer = function(customerObject) {
  return gladlyApiRequest('PATCH', `/api/v1/customer-profiles/${customerObject.id}`, customerObject);
}

//https://developer.gladly.com/rest/#operation/createTaskAndCustomer
module.exports.createTask = function(taskObject) {
  return gladlyApiRequest('POST', `/api/v1/tasks`, taskObject);
}

//https://developer.gladly.com/rest/#operation/getInboxes
module.exports.listInboxes = function() {
  return gladlyApiRequest('GET', `/api/v1/inboxes`);
}

//https://developer.gladly.com/rest/#operation/getTopics
module.exports.listTopics = function() {
  return gladlyApiRequest('GET', `/api/v1/topics`);
}

//https://developer.gladly.com/rest/#operation/getAgents
module.exports.listAgents = function() {
  return gladlyApiRequest('GET', `/api/v1/agents`);
}

//https://developer.gladly.com/rest/#operation/getConversation
module.exports.getConversation = function(id) {
  return gladlyApiRequest('GET', `/api/v1/conversations/${id}`);
}

//https://developer.gladly.com/rest/#operation/getItem
module.exports.getConversationItem = function(id) {
  return gladlyApiRequest('GET', `/api/v1/conversation-items/${id}`);
}

//https://developer.gladly.com/rest/#operation/patchConversation
module.exports.updateConversation = function(id, payload) {
  return gladlyApiRequest('PATCH', `/api/v1/conversations/${id}`, payload);
}

//https://developer.gladly.com/rest/#operation/replyToMessage
module.exports.replyToMessage = function(id, payload) {
  return gladlyApiRequest('POST', `/api/v1/conversation-items/${id}/reply`, payload);
}

//https://developer.gladly.com/rest/#operation/createItem
module.exports.createItem = function(payload) {
  return gladlyApiRequest('POST', `/api/v1/conversation-items`, payload);
}

//https://developer.gladly.com/rest/#operation/getConversationItems
module.exports.getItems = function(id) {
  return gladlyApiRequest('GET', `/api/v1/conversations/${id}/items`);
}

//https://developer.gladly.com/rest/#operation/addTopicToConversation
module.exports.addTopic = function(id, payload) {
  return gladlyApiRequest('POST', `/api/v1/conversations/${id}/topics`, payload);
}
