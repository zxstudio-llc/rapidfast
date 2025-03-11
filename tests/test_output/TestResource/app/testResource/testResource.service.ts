import { Injectable } from '@angelitosystems/rapidfast';

@Injectable()
export class TestResourceService {
  private items: any[] = [];
  private idCounter = 1;

  async findAll() {
    return this.items;
  }

  async findOne(id: string) {
    const numericId = Number(id);
    return this.items.find(item => item.id === numericId);
  }

  async create(data: any) {
    const newItem = { id: this.idCounter++, ...data };
    this.items.push(newItem);
    return newItem;
  }

  async update(id: string, data: any) {
    const numericId = Number(id);
    const index = this.items.findIndex(item => item.id === numericId);
    
    if (index === -1) {
      return null;
    }
    
    const updatedItem = { ...this.items[index], ...data };
    this.items[index] = updatedItem;
    return updatedItem;
  }

  async delete(id: string) {
    const numericId = Number(id);
    const index = this.items.findIndex(item => item.id === numericId);
    
    if (index === -1) {
      return false;
    }
    
    this.items.splice(index, 1);
    return true;
  }
}
