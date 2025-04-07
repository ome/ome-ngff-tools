
The following versions of each viewer were used in testing:

- <a href="https://napari.org">napari</a> 0.5.6 with plugin <a href="https://github.com/ome/napari-ome-zarr/">napari-ome-zarr</a> 0.6.1 and <a href="https://github.com/ome/ome-zarr-py/">ome-zarr</a> 0.10.3.
  - Open via command line: `napari https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0062A/6001240.zarr`
  - Use napari console to open additional image: `viewer.open("https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0101A/13457537.zarr", plugin="napari-ome-zarr")`
- <a href="https://github.com/hms-dbmi/vizarr/">vizarr</a> using <a href="https://hms-dbmi.github.io/vizarr">current viewer</a> April 2025. Open via URL - see <a href="https://hms-dbmi.github.io/vizarr/?source=https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.3/idr0079A/9836998.zarr">example</a>.
- <a href="https://imagej.net/plugins/bdv/">BigDataViewer</a> comes with Fiji.
  - Open with: `Plugins > BigDataViewer > HDF5/N5/Zarr/OME-NGFF Viewer`.
- <a href="https://github.com/mobie/mobie-viewer-fiji/">MoBIE</a> plugin for ImageJ/Fiji (mobie-viewer-fiji v6.2.0, mobie-io v4.0.1).
  - See <a href="https://omero-guides.readthedocs.io/en/latest/fiji/docs/view_mobie_zarr.html">MoBIE  guide</a> for installation instructions and how to open Zarr files. Hint: Press ``p`` to bring the rendering settings controls.
  - To open labels images: `Plugins > MoBIE > Open > Open OME ZARR` then enter image `URL.zarr` and `URL.zarr/labels/name` (Open the image in ome-ngff-validator first and browse to labels to get the correct URL).
- <a href="https://itkwidgets.readthedocs.io/en/latest">itkwidgets</a>. Use in a python notebook, or open via URL: See <a href="https://kitware.github.io/itk-vtk-viewer/app/?rotate=false&fileToLoad=https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0062A/6001240.zarr">example</a>.
- <a href="https://github.com/google/neuroglancer">neuroglancer</a>.
- <a href="https://webknossos.org">webKnossos</a> version 24.03.0.
- <a href="https://www.openmicroscopy.org/omero/">OMERO</a> with BioFormats <a href="https://github.com/ome/ZarrReader">ZarrReader</a> 0.2.0.

NB: the <a href="https://github.com/saalfeldlab/n5-viewer">N5-viewer</a>, a Fiji plugin based on BigDataViewer, will also support OME-NGFF soon.


<style>
  .supported {
    background: green;
  }
  .fails {
    background: red;
  }
  .ignored {
    background: yellow;
  }
  .missing {
    background: grey;
  }
  .feature img {
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

  @-webkit-keyframes seesaw { from { transform: rotate(-0.05turn) } to { transform: rotate(0.05turn); }  }
  @keyframes seesaw { from { transform: rotate(-0.05turn) } to { transform: rotate(0.05turn); }  }
</style>

</style>

<h3>Key</h3>

<table>
  <tbody>
  <tr>
    <td>Feature supported</td>
    <td class="supported"> </td>
  </tr>
  <tr>
    <td>Not supported (no effect)</td>
    <td class="ignored"> </td>
  </tr>
  <tr>
    <td>Image doesn't open correctly</td>
    <td class="fails"> </td>
  </tr>
  <tr>
    <td>Not tested / not confirmed</td>
    <td class="missing"> </td>
  </tr>
  </tbody>
</table>

  

<table>
  <thead>
    <tr>
      <th>feature</th>
      <td>sample data</td>
      {% for viewer in site.data.viewers %}
        <th>{{ viewer.id }}</th>
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
