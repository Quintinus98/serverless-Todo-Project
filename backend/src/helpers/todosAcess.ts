import 'source-map-support/register'

import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';

const logger = createLogger('todosAcess')

// TODO: Implement the dataLayer logic

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = new DocumentClient(),
    private readonly todoTable = process.env.TODOS_TABLE,
    private readonly todosCreatedAtIndex = process.env.TODOS_CREATED_AT_INDEX
) {}


  // Get all Todos for a particular User.
  async getTodos(userId: string): Promise<TodoItem[]> {
    logger.info(`Getting all Todos for user: ${userId}`);

    const params = {
      TableName: this.todoTable,
      IndexName: this.todosCreatedAtIndex,
      KeyConditionExpression: "#userId = :userId",
      ExpressionAttributeNames: {
        "#userId": "userId"
      },
      ExpressionAttributeValues: {
        ":userId": userId
      }
    };

    const result = await this.docClient.query(params, function(err: any, data: any) {
      if (err) logger.info(err);
      else logger.info(data);
    }).promise();


    return result.Items as TodoItem[]    
  }
    

    // Create a Todo Item
    async createTodo( todo: TodoItem ): Promise<string> {
        
      logger.info(`Creating a Todo with userId: ${todo.userId}`);
      
      let params = {
          TableName : this.todoTable,
          Item: todo
        };
        
      await this.docClient.put(params, function(err: any, data: any) {
      if (err) logger.info(err);
      else logger.info(data);
      }).promise();

      return `Created successfully!`;
    }


    // Update a Todo Item
    async updateTodo(todoId:string, todoUpdate:TodoUpdate): Promise<string> {
        logger.info(`Updating Todo item with ID: ${todoId}`)
        let params = {
            TableName: this.todoTable,
            Key: { "todoId": todoId },
            UpdateExpression: 'set #a = :a, #b = :b, #c = :c',
            ExpressionAttributeNames: {
                "#a": "name",
                "#b": "dueDate",
                "#c": "done"
            },
            ExpressionAttributeValues: {
                ':a' : todoUpdate['name'],
                ':b' : todoUpdate['dueDate'],
                ':c' : todoUpdate['done'],
            },
            ReturnValues: "ALL_NEW"
        };
        
        await this.docClient.update(params, function(err: any, data: any) {
            if (err) logger.info(err);
            else logger.info(data);
        }).promise();

        return `Updated successfully!`
    }
    
    // Update attachment Url
    async updateAttachmentUrl( todoId:string, attachmentUrl:string ): Promise<string> {
        logger.info(`Updating Attachment Url with ID: ${todoId}`)
        let params = {
            TableName: this.todoTable,
            Key: { todoId : todoId },
            UpdateExpression: 'SET #attachmentUrl = :attachmentUrl',
            ExpressionAttributeValues: {
                ':attachmentUrl' : attachmentUrl
            }
        };
        
        await this.docClient.update(params, function(err, data) {
            if (err) logger.info(err);
            else logger.info(data);
        }).promise();
    
        return 'Updated Successfully!'
    }

    // Delete Todo Item
    async deleteTodo(todoId:string): Promise<string> {
        logger.info (`Deleting Todo Item: ${todoId}`)
        let params = {
            TableName : this.todoTable,
            Key: {
                "todoId": todoId
            }
        };
          
        await this.docClient.delete(params, function(err: any, data: any) {
            if (err) logger.info(err);
            else logger.info(data);
        }).promise();
        
        return "Deleted Successfully!"
    }
}

