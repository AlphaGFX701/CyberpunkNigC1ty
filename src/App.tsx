import { AssetGallery } from './ui/AssetGallery'
import { EntryApp } from './entry/EntryApp'

export default function App() {
  return new URLSearchParams(window.location.search).get('ui') === '1' ? (
    <AssetGallery />
  ) : (
    <EntryApp />
  )
}
