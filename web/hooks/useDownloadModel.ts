import { useCallback } from 'react'

import { DownloadState, ExtensionTypeEnum, ModelExtension } from '@janhq/core'

import { useSetAtom } from 'jotai'

import { toaster } from '@/containers/Toast'

import { setDownloadStateAtom } from './useDownloadState'

import { extensionManager } from '@/extension/ExtensionManager'

import {
  addDownloadingModelAtom,
  removeDownloadingModelAtom,
} from '@/helpers/atoms/Model.atom'

export default function useDownloadModel() {
  const removeDownloadingModel = useSetAtom(removeDownloadingModelAtom)
  const addDownloadingModel = useSetAtom(addDownloadingModelAtom)
  const setDownloadStates = useSetAtom(setDownloadStateAtom as any)

  const downloadModel = useCallback(
    async (model: string, id?: string, name?: string) => {
      addDownloadingModel(id ?? model)
      setDownloadStates({
        modelId: id ?? model,
        downloadState: 'downloading',
        fileName: id ?? model,
        size: {
          total: 0,
          transferred: 0,
        },
        percent: 0,
        isPaused: false,
      })
      downloadLocalModel(model, id, name).catch((error) => {
        if (error.message) {
          toaster({
            title: 'Download failed',
            description: error.message,
            type: 'error',
          })
        }

        removeDownloadingModel(model)
      })
    },
    [removeDownloadingModel, addDownloadingModel, setDownloadStates]
  )

  const abortModelDownload = useCallback(async (model: string) => {
    await cancelModelDownload(model)
  }, [])

  const pauseModelDownload = useCallback(async (model: string) => {
    try {
      await pauseModelDownload(model)

      setDownloadStates((prev: Record<string, DownloadState>) => ({
        ...prev,
        [model]: {
          ...prev[model],
          isPaused: true,
          downloadState: 'paused',
        },
      }))

      toaster({
        title: 'Download Paused',
        description: `Download for ${model} has been paused`,
        type: 'default',
      })
    } catch (error) {
      toaster({
        title: 'Pause Failed',
        description: `Unable to pause download for ${model}`,
        type: 'error'
      })
    }
  }, [setDownloadStates])

  const resumeModelDownload = useCallback(async (model: string) => {
    try {
      await resumeModelDownload(model)
      setDownloadStates((prev: any) => {
        const updatedState = { ...prev[model], isPaused: false, downloadState: 'downloading' }
        return { ...prev, [model]: updatedState }
      })
      toaster({
        title: 'Download Resumed',
        description: `Download for ${model} has been resumed`,
        type: 'success'
      })
    } catch (error) {
      toaster({
        title: 'Resume Failed',
        description: `Unable to resume download for ${model}`,
        type: 'error'
      })
    }
  }, [setDownloadStates])

  return {
    downloadModel,
    abortModelDownload,
    pauseModelDownload,
    resumeModelDownload
  }
}

const downloadLocalModel = async (model: string, id?: string, name?: string) =>
  extensionManager
    .get<ModelExtension>(ExtensionTypeEnum.Model)
    ?.pullModel(model, id, name)

const cancelModelDownload = async (model: string) =>
  extensionManager
    .get<ModelExtension>(ExtensionTypeEnum.Model)
    ?.cancelModelPull(model)

const pauseModelDownload = async (model: string) =>
  extensionManager
    .get<ModelExtension>(ExtensionTypeEnum.Model)
    ?.pauseModelPull(model)

const resumeModelDownload = async (model: string) =>
  extensionManager
    .get<ModelExtension>(ExtensionTypeEnum.Model)
    ?.resumeModelPull(model)
