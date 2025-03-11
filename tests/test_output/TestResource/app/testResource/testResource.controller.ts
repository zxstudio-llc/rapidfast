import { Controller, Get, Post, Put, Delete, Req, Res } from '@angelitosystems/rapidfast';
import { Request, Response } from 'express';
import { TestResourceService } from './testResource.service';

@Controller('/testResources')
export class TestResourceController {
  constructor(private testResourceService: TestResourceService) {}

  @Get()
  async findAll(@Res() res: Response) {
    const items = await this.testResourceService.findAll();
    return res.json(items);
  }

  @Get('/:id')
  async findOne(@Req() req: Request, @Res() res: Response) {
    const { id } = req.params;
    const item = await this.testResourceService.findOne(id);
    
    if (!item) {
      return res.status(404).json({ message: 'TestResource no encontrado' });
    }
    
    return res.json(item);
  }

  @Post()
  async create(@Req() req: Request, @Res() res: Response) {
    const newItem = await this.testResourceService.create(req.body);
    return res.status(201).json(newItem);
  }

  @Put('/:id')
  async update(@Req() req: Request, @Res() res: Response) {
    const { id } = req.params;
    const updatedItem = await this.testResourceService.update(id, req.body);
    
    if (!updatedItem) {
      return res.status(404).json({ message: 'TestResource no encontrado' });
    }
    
    return res.json(updatedItem);
  }

  @Delete('/:id')
  async remove(@Req() req: Request, @Res() res: Response) {
    const { id } = req.params;
    const deleted = await this.testResourceService.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'TestResource no encontrado' });
    }
    
    return res.status(204).send();
  }
}
