
The following versions of each viewer were used in testing:

- <a href="https://napari.org">napari</a> 0.5.6 with plugin <a href="https://github.com/ome/napari-ome-zarr/">napari-ome-zarr</a> 0.6.1 and <a href="https://github.com/ome/ome-zarr-py/">ome-zarr</a> 0.10.3.
  - Open via command line: `napari https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0062A/6001240.zarr`
  - Use napari console to open additional image: `viewer.open("https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0101A/13457537.zarr", plugin="napari-ome-zarr")`
- <a href="https://github.com/hms-dbmi/vizarr/">vizarr</a> using <a href="https://hms-dbmi.github.io/vizarr">current viewer</a> April 2025. Open via URL - see <a href="https://hms-dbmi.github.io/vizarr/?source=https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.3/idr0079A/9836998.zarr">example</a>.
- [Vol-E](https://github.com/allen-cell-animated/vole-app)
- <a href="https://imagej.net/plugins/bdv/">BigDataViewer</a> comes with Fiji. Jar versions include bigdataviewer_fiji-6.4.1.jar, bigdataviewer-core-10.6.4, bigdataviewer-image-loaders-0.9.0, bigdataviewer-n5-1.0.2.jar.
  - Open with: `Plugins > BigDataViewer > HDF5/N5/Zarr/OME-NGFF Viewer`. In the dialog, enter the URL and click `OK`.
  - To include labels, enter the image URL in the dialog, then click `Detect datasets`. Expand the tree and select an image under `labels` AND use Cmd-click to also select the top-level parent image. With both selected, click `OK`.
- <a href="https://github.com/mobie/mobie-viewer-fiji/">MoBIE</a> plugin for ImageJ/Fiji (mobie-viewer-fiji v6.3.1, mobie-io v4.0.3).
  - See <a href="https://omero-guides.readthedocs.io/en/latest/fiji/docs/view_mobie_zarr.html">MoBIE  guide</a> for installation instructions. Hint: Press ``p`` to bring the rendering settings controls.
  - To open images: `Plugins > MoBIE > Open > Open OME ZARR` then enter image `URL.zarr`. If you want to include labels, also fill the labels field with `URL.zarr/labels/<name>` (Open the image in ome-ngff-validator first (OME icon in table below) and browse to labels to get the correct URL).
  - To open Plates: `Plugins > MoBIE > Open > Open HCS Dataset`.
- <a href="https://itkwidgets.readthedocs.io/en/latest">itkwidgets</a>. Use in a python notebook, or open via URL: See <a href="https://kitware.github.io/itk-vtk-viewer/app/?rotate=false&fileToLoad=https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0062A/6001240.zarr">example</a>.
- <a href="https://github.com/google/neuroglancer">neuroglancer</a>.
- <a href="https://webknossos.org">webKnossos</a> version 24.11.0.
- <a href="https://www.openmicroscopy.org/omero/">OMERO</a> with BioFormats <a href="https://github.com/ome/ZarrReader">ZarrReader</a> 0.2.0.
- <a href="https://extensions.blender.org/add-ons/microscopynodes/">Microscopy Nodes</a> plugin to load microscopy data in <a href="https://www.blender.org">Blender</a>. Tested with Blender 4.4.1 and Microscopy Nodes 2.2.0.

NB: the <a href="https://github.com/saalfeldlab/n5-viewer">N5-viewer</a>, a Fiji plugin based on BigDataViewer, will also support OME-NGFF soon.


<style>
  .supported {
    background: #8BC34A;
  }
  .fails {
    background: #f44336c9;
  }
  .ignored {
    background: #ffeb3ba1;
  }
  .missing {
    background: #cccccc;
  }
  .feature img {
    opacity: 0.5;
  }
  .feature {
    background: white;
    position: sticky;
    left: 0;
    z-index: 10;
    min-width: 200px;
    max-width: 200px;
  }
  .supported img, .fails img, .missing img, .ignored img {
    opacity: 0.5;
  }

  .icon {
      width: 24px;
      height: 24px;
  }
  .no_border {
      border: none;
      background: none;
      padding: 0;
  }
  .shake {
      animation: 0.1s linear 0s infinite alternate seesaw;
  }

  td, th {
    max-width: 130px;
    min-width: 130px;
  }
  .wider {
    min-width: 150px;
  }

  @-webkit-keyframes seesaw { from { transform: rotate(-0.05turn) } to { transform: rotate(0.05turn); }  }
  @keyframes seesaw { from { transform: rotate(-0.05turn) } to { transform: rotate(0.05turn); }  }
</style>

<h3>Key</h3>

<table>
  <tbody>
  <tr>
    <td class="supported">Feature supported</td>
    <td class="ignored">Not supported (no effect)</td>
    <td class="fails">Image doesn't open correctly</td>
    <td class="missing">Not tested / not confirmed</td>
  </tr>
  </tbody>
</table>


<div style="float: right">Scroll right for more viewers -></div>
<table>
  <thead>
    <tr>
      <th class="feature">feature</th>
      <td>sample data</td>
      {% for viewer in site.data.viewers %}
        <th {% if viewer.widercol %} class="wider" {% endif %}>{{ viewer.id }}</th>
      {% endfor %}
    </tr>
  </thead>
  <tbody>
    {% for feature in site.data.features %}
      <tr>
        <td class="feature">
          {{ feature.name }}
          {% if feature.description %}
            <img src="assets/img/icon_info.svg" width="20px" height="20px" title="{{ feature.description }}" />
          {% endif %}
        </td>
        <td class="sample">
          {% if feature.sample_url and feature.sample_name %}
            {{ feature.sample_name }}
            <button class="no_border" title="Copy S3 URL to clipboard" onclick="copyTextToClipboard('{{ feature.sample_url }}')">
              <img src="assets/img/copy.png" width="24px" height="24px" />
            </button>
            <a href="https://ome.github.io/ome-ngff-validator/?source={{ feature.sample_url }}" target="_blank" title="Open in ome-ngff-validator">
              <img src="assets/img/ome_logo-16x16.png" width="20px" height="20px" /></a>
          {% endif %}
          {% if feature.sample_html %}
            {{ feature.sample_html }}
          {% endif %}
        </td>

        {% for viewer_data in site.data.viewers %}
        {% assign viewer = viewer_data.id %}
        <td class="{% if feature[viewer].supported %}supported{% elsif feature[viewer].opens == false %}fails{% elsif feature[viewer].opens %}ignored{% else %}missing{% endif %}">

          {% if feature[viewer].viewer_url %}
            <!-- e.g. webknossos or OMERO might have URLs for imported images -->
            <a href="{{ feature[viewer].viewer_url }}" target="_blank" title="View the sample file in this viewer in a new tab">
              <img src="assets/img/icon_eye.svg" />
            </a>
          {% elsif viewer_data.viewer_url and feature.sample_url%}
          <!-- e.g. vizarr, vtk and neuroglancer allow direct opening image URL in viewer -->
            <a href='{{ viewer_data.viewer_url }}{{ feature.sample_url }}{% if viewer_data.viewer_url_postfix %}{{ viewer_data.viewer_url_postfix }}{% endif %}'
               target="_blank" title="View the sample file in this viewer in a new tab">
              <img src="assets/img/icon_eye.svg" />
            </a>
          {% endif %}

          {% if feature[viewer].issue_url %}
            <a href="{{ feature[viewer].issue_url }}" target="_blank">
              <img src="https://github.githubassets.com/favicons/favicon.svg" width="20px" height="20px" />
            </a>
          {% endif %}

          {% if feature[viewer].notes %}
            <img src="assets/img/icon_info.svg" width="20px" height="20px" title="{{ feature[viewer].notes }}" />
          {% endif %}
        </td>
        {% endfor %}
      </tr>
    {% endfor %}
  </tbody>
</table>

<script>


function copyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    // Place in the top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';

    textArea.value = text;

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    var successful;
    try {
        successful = document.execCommand('copy');
    } catch (err) {
        console.log('Oops, unable to copy');
    }
    document.body.removeChild(textArea);

    if (successful) {
        // show user that copying happened - shake for 1 second
        let target = event.target;
        let html = target.innerHTML;
        target.classList.add("shake");
        setTimeout(() => {
            // reset after 1 second
            target.classList.remove("shake");
        }, 1000)
    } else {
        console.log("Copying failed")
    }
}
</script>
