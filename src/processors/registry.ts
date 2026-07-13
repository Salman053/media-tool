import type { Processor, MediaType } from '../types'

class ProcessorRegistry {
  private processors = new Map<MediaType, Processor>()

  register(processor: Processor): void {
    this.processors.set(processor.type, processor)
  }

  get(type: MediaType): Processor | undefined {
    return this.processors.get(type)
  }
}

export const processorRegistry = new ProcessorRegistry()
