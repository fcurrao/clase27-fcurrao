
import mongoose from 'mongoose' 
import { messagesModel } from './models/messages.model';
import { environment } from '../.env/environment';


export default class MessageManager {
  connection = mongoose.connect(
    // "mongodb+srv://fcurrao1:fcurrao1@cluster0.pzrcxla.mongodb.net/?retryWrites=true&w=majority"
    environment.mongoConnection
    )
  


  async addChat(chat) {
    let result = await messagesModel.create(chat) 
    return result;
   }


}